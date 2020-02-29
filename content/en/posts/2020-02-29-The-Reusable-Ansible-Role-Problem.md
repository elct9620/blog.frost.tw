---
title: "The Reusable Ansible Role Problem"
date: 2020-02-29T17:59:46+08:00
tags: ["Ansible", "DevOps", "Experience", "Rails", "Ruby on Rails"]
toc: true
thumbnail: https://blog.frost.tw/images/2020-02-29-the-reusable-ansible-role-problem/thumbnail.jpg
credit: Photo by Valentin Antonucci from Pexels
---

About 1 year ago, I build a [Ansible](https://www.ansible.com/) playbook for the customers of [5xRuby](https://5xruby.tw).

When our customers grow it is hard to use the fork feature to maintenance our customer's playbook.

I have to update the main version and sync the changes to the fork version for each customer. Therefore I decided to split the common parts to a single role repository.

<!--more-->

## Overview

In the current version, we have a playbook like below:

```
├── [1.0K]  README.md
├── [  96]  group_vars
│   └── [1.2K]  all.yml
├── [  96]  inventories
│   └── [ 309]  local
├── [ 480]  roles
│   ├── [  96]  5xruby_user
│   ├── [  96]  application
│   ├── [  96]  compile_env
│   ├── [  96]  deploy_user
│   ├── [  96]  init
│   ├── [ 128]  logrotate
│   ├── [ 160]  nginx_with_passenger
│   ├── [  96]  node
│   ├── [ 160]  postgresql_server
│   ├── [  96]  ruby
│   ├── [  96]  ssh
│   ├── [  96]  sudo
│   └── [ 128]  yum_install_commons
└── [ 467]  setup.yml
```

When our customer needs to customize their provision environment, we have to fork it and change the variables and some template.

But it is hard to update the playbook because it may cause some conflict.

## Target

The Ansible Galaxy provides the dependencies manage feature to Ansible, it allows us to use `roles/requirements.yml` to manage it like below:

```yml
- src: https://github.com/5xruby/ansible-ruby
  version: 0.1.0
- src: https://github.com/5xruby/ansible-nginx
  version: 0.1.0
```

Before we run the playbook, we can use `ansible-galaxy install -r roles/requirements.yml` to automatically install these roles. And it also works well with [Ansible AWX](https://github.com/ansible/awx) (a.k.a Ansible Tower)

That sounds good, but when I start work on it I got some problems.

## Nginx Modules

For [Rails](https://rubyonrails.org/) project, we have more than one choice of the webserver.

If we use [Puma](https://puma.io/) we only require to configure Nginx as a reverse proxy.

But if we decide to use [Passenger](https://www.phusionpassenger.com/) we have to compile it as an Nginx module.

It means if I want to support Puma and Passenger together, my Nginx role should include the Passenger tasks.

My first version is to use the [`include_tasks`](https://docs.ansible.com/ansible/latest/modules/include_tasks_module.html) to add an extra module config when enabled Passenger.

But if we want to add more Nginx modules in the future? Our Nginx role will grow and becomes another huge playbook.

## Manual Dependencies

After many tries, I find an acceptable implement to resolve the problem.

1. Create a Fact `nginx_module_options` as empty array
2. Loop `nginx_extar_modules` to `import_role` to execute module related tasks
3. After the module's source code downloaded, append configure options to `nginx_module_options`

In our playbook, we can configure dependencies like below:

```yml

- src: https://github.com/5xruby/ansible-nginx
  version: 0.1.0
- src: https://github.com/5xruby/ansible-passenger
  version: 0.1.0
```

And add Nginx module options to `group_vars/all.yml` as a default config to apply to all web hosts.

```yml
nginx_extra_modules: ['passenger']
```

After resolving the Nginx module problem, another problem is coming.

## The Role Dependencies

When I prepare the Nginx, Ruby, Node.js, and others required for deploy Rails. I configure the Rails role's dependencies.

```yml
dependencies:
  - src: https://github.com/5xruby/ansible-nginx
  - src: https://github.com/5xruby/ansible-ruby
  - src: https://github.com/5xruby/ansible-node
  - src: https://github.com/5xruby/ansible-passenger
```

When I use my playbook to run `rails` role, it starts the task from the `nginx` role.

It seems no problem for us, but we have to configure the `nginx.conf` and set the `root` to our application's public directory.

If the `nginx` role is run before the `rails` role, we will get the Nginx start failed error.

> The first version Nginx will create the root directory with customized owner and group, but it has some problems in this case. The deploy user is created by the `rails` role and it will unable to find the owner user which is not created yet.

But after clarifying the problem, it is a human design mistake.

"The Nginx is the dependencies of Rails?"

If we use the Puma, we can replace Nginx to any reverse proxy server. So we didn't dependent on the Nginx.

## Final Produce

After about two days of hard work, I have a new playbook almost zero-config to deploy a server for Rails.

```
├── install.yml
├── group_vars
│  └── all.yml
├── inventory
├── playbooks
│  └── install-nginx.yml
│  └── install-postgres.yml
│  └── install-rails.yml
├── roles
│  └── requirements.yml
├── templates
└ ─── nginx.conf.j2
```

Everything is very simple, usually use `import_role: nginx` to add the necessary role.

If we need more customized we can override the variable (e.g. `nginx_config_template`) and put the customize template to `templates/nginx.conf.j2`

> I only put a default Nginx config inside the Nginx role and put the customize `nginx.conf` in the playbook to enable the Passenger.

## Conclusion

This is an interesting experience to "decouple" the provision script. As a programmer, we have a lot of rule can follow to decouple our program. But when you are working on the operation-side, how to create a reusable script and manageable?

But this work is only the start. I am considering the future upgrade after I finished this stage.

* How to clear the old versions?
* If the database has to upgrade, should I create a new server?
* If used for creating a Cloud Image (e.g. AMI) how to clear up?

The DevOps sounds very easy to put developer and operator together but make the work together still hard, I guess.
