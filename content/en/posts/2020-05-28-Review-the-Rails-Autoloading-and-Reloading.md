---
title: "Review the Rails' Autoloading and Reloading"
publishDate: 2020-04-28T00:31:53+08:00
date: 2020-04-28T00:31:53+08:00
tags: ["Ruby", "Rails", "Autoloading"]
toc: true
thumbnail: https://blog.frost.tw/images/2020-05-28-review-the-rails-autoloading-and-reloading/thumbnail.jpg
credit: Photo by Miguel Á. Padriñán from Pexels
---

A few years ago, I have a post talking about [Autoloading](https://blog.frost.tw/posts/2017/03/06/The-Rails-auto-reload-trap/). In recent days, my colleague has some problems with Autoloading and Reloading.

Therefore I decided to review the Autoloading mechanism in Rails 5 and 6.

<!--more-->

## Why Autoloading?

Before we starting to discuss Autoloading or Reloading, I want to spend some time to think about it.

In the C, C++, or Java which is compiled language. They didn't need to autoload because the compiler will include the necessary parts to the binary. And we usually use `#include` or `import` to include the related symbols to reference the codes we are required.

But in the Ruby, PHP, or Node.js which is interpreted in the runtime. That means our code didn't preprocess before we execute it. And our code didn't know other code until we `require` or `include` them into our main program file.

These two types of languages are trying to split codes into small files. But for the interpreted language we cannot skip unnecessary files to loaded if we require each file.

In Ruby, we have a keyword [`autoload`](https://ruby-doc.org/core-2.7.0/Module.html#method-i-autoload-3F) that allows us to define "when the constant not defined, load the specify file." to implement load required files.

It may reduce memory usage when we load a large amount of code in our application. But I  more believe autoloading is used to help us to find codes in a large application that has many files.

## The require method

In my code review, I ask for my colleague to use `require 'middleware/domain_rewriter'` instead `require_relative '../lib/middleware/domain_rewriter'` to include our extra middleware in Rails in `config/application.rb`

But it doesn't work correctly, we have to use `require_relative` in this case.

The question is "why we can use `require` in the non-relatives path?"

In Ruby, we have a global variable named `$LOAD_PATH` if we use `pp` to print it, we can find our Ruby install path is listed inside it. It will let Ruby find files inside these paths when we try to require something.

If we have the `Gemfile` in the project folder, the gems install path will be added to this list. This is why we can require gems only to add them to the Gemfile.

After we know the `$LOAD_PATH` provide `require` search paths, the reason why `config/application.rb` cannot directly require `lib/` is easier to recognize.

The Rails is a Rack-based application and it usually boots from `config.ru`.

```ruby
# frozen_string_literal: true

# This file is used by Rack-based servers to start the application.

require_relative "config/environment"

run Rails.application
```

This file requires the `config/environment.rb` and we can find it require the `config/application.rb`

```ruby
# frozen_string_literal: true

# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!
```

It is obvious the Rails didn't add `lib/` into the `$LOAD_PATH` and we cannot require them directly.

## The Autoloading

Since we can load library elegant by use `require` but we still need to require the application code via `require_relative` and it makes us feel annoyed when our codebase is growing.

Since Rails 6, it starts to use the [`Zeitwerk`](https://github.com/fxn/zeitwerk) as the code loader, we will use it as an example in this post to reduce complex behaviors behind it.

According to Zeitwerk's readme, we can know the basic logic is below shows:

```
lib/my_gem.rb         -> MyGem
lib/my_gem/foo.rb     -> MyGem::Foo
lib/my_gem/bar_baz.rb -> MyGem::BarBaz
lib/my_gem/woo/zoo.rb -> MyGem::Woo::Zoo
```

It is very similar to we put the files inside `app/controller` or `app/models` because Rails register these directories for us.

> This is mean it is not required to use `_controller` as postfix in your ` app/controller` folder, but it will cause other hard to recognize the file usage.

The Zeitwerk uses Ruby's `autoload` to load classes when we configure the autoload paths, it will scan all files and add them to the related classes' autoload list.

> In my memory, the older version Rails has its autoloading implementation via override some Kernel methods and rescue NameError to find the actual file path to load it.

## The Reloading

I think this part is the most Junior developer feeling confuse when they try to `require` something but it breaks when they update some code.

In Zeitwerk we have `#enable_reloading` options can grant permission to call the `#reload` method. The reloading feature is helpful in the development environment when we change something but not required to restart the server.

> For the compiled language, it is necessary to recompile and reopen it. But there have other methods can prevent it.

But why we can `#unload` the interpreted code? This usually depends on the language feature, in the Ruby the constant variable is changeable and allows to be removed.

When we call the `#reload` method, the Zeitwerk will [`#unload`](https://github.com/fxn/zeitwerk/blob/806795d302840a7e96612b88ff45f231ea4318b0/lib/zeitwerk/loader.rb#L796) constants which are loaded.  And load all classes again to put the new codes into memory.

That is means when we have a top-level constant is unloaded, the children will be unloaded together.

This is a common mistake when we defined a child class in the same file with parent class, but directly use it in other file but didn't load its parent.

> It may not happen in newer Rails, the loader will try to load its parent before load it.

In the same case, a similar mistake is we define the `API` namespace under autoload managed folder (eg. `app/`) and define the in the not-managed folder (eg. `lib/`), too.

When we change some files under `app/` folder and it will unload the `API` namespace, after reload the `lib/` defined `API` will be unloaded and never go back.

The reason is the `require` recognize the file is loaded, therefore Ruby thinks it didn't load again but it is unloaded for reloading.

Below codes is an example:

```ruby
# frozen_string_literal: true

require_relative 'api'
pp defined?(API)
# => "constant"

Object.send(:remove_const, 'API')
require_relative 'api'
pp defined?(API)
# => nil

load "api.rb"
pp defined?(API)
# => "constant"
```

The `require` can prevent we load the same file twice but the `load` didn't check for it. The Zeitwerk also overrides the [`#require`](https://github.com/fxn/zeitwerk/blob/master/lib/zeitwerk/kernel.rb#L24) method to provide a similar feature which managed by Zeitwerk loader.

Depends on the above example, we can have an outline of the Rails' autoloading and reloading mechanism to help us use them more reasonably.

## Conclusion

In the end, I have on more thing I want to talk about. The `lib/` is managed by Rails, too. But it can be used after Rails is booted, this is the reason we cannot use them in the `config/application.rb` before boot.

> The source is [here](https://github.com/rails/rails/blob/758e4f8406e680a6cbf21b170749202c537a2576/railties/lib/rails/engine/configuration.rb#L53) to defined as load path and [here](https://github.com/rails/rails/blob/c0d91a4f9da10094ccdb80e34d1be42ce1016c9a/railties/lib/rails/engine.rb#L570-L575) to add into load path.

The autoloading and reloading are useful when we develop our application and Zeitwerk allows us to add it to our project easier. If you have projects not based on Rails, I suggest you try to add it and learn more from practice.
