import { parseDdlToRds } from "./index"

const input = `
create table account (
    account_id bigint not null primary key autoincrement,
    name varchar(255) not null,
    login varchar(255) not null unique,
    email varchar(255) not null unique,
    role varchar(50) not null default 'contrib',
    password varchar(255) null
    -- avatar as file
);

create table step (
    step_id bigint not null primary key autoincrement,
    label varchar(255) not null unique,
    order_num integer
);

create table project (
    project_id bigint not null primary key autoincrement,
    code varchar(255) not null unique,
    archived tinyint not null default 0,
    task_seq bigint not null
);

create table project_step (
    project_id bigint not null references project on delete cascade,
    step_id bigint not null references step(step_id),
    primary key (project_id, step_id)
);

create table task (
    task_id bigint not null primary key autoincrement,
    project_id bigint not null references project(project_id),
    cur_step_id bigint not null references step(step_id),
    code varchar(255) not null unique,
    created_by bigint not null references account(account_id),
    label varchar(255) not null,
    create_ts timestamp not null default current_timestamp,
    update_ts timestamp not null default current_timestamp,
    foreign key (project_id, cur_step_id) references project_step(project_id, step_id)
);

create table task_child (
    task_id bigint not null primary key references task(task_id) on delete cascade,
    parent_task_id bigint not null references task(task_id),
    order_num integer
);

create table task_description (
    task_id bigint not null primary key references task(task_id) on delete cascade,
    description text not null
);

create table task_affected_to (
    task_id bigint not null references task(task_id) on delete cascade,
    account_id bigint not null references account(account_id),
    order_num integer,
    primary key (task_id, account_id)
);

create table task_log (
    task_log_id bigint not null primary key autoincrement,
    task_id bigint not null references task(task_id) on delete cascade,
    step_id bigint not null references step(step_id) on delete cascade,
    entry_ts timestamp not null default current_timestamp,
    account_id bigint not null references account(account_id)
);

create table root_task (
    project_id bigint not null primary key references project(project_id),
    task_id bigint not null unique references task(task_id)
);

create table flag (
    flag_id bigint not null primary key autoincrement,
    label varchar(255) not null unique,
    color char(6),
    order_num integer
);

create table task_flag (
    task_id bigint not null references task(task_id) on delete cascade,
    flag_id bigint not null references flag(flag_id),
    primary key (task_id, flag_id)
);

create table comment (
    comment_id bigint not null primary key autoincrement,
    task_id bigint not null references task(task_id) on delete cascade,
    written_by bigint not null references account(account_id),
    body text not null,
    create_ts timestamp not null default current_timestamp,
    update_ts timestamp not null default current_timestamp
);

-- Application: frontend-registration or frontend-entry
create table reg_pwd (
    reg_pwd_id bigint not null primary key autoincrement,
    token varchar(255) not null unique,
    account_id bigint not null references account(account_id),
    expire_ts timestamp not null,
    create_ts timestamp not null default current_timestamp
);

create table reg_new (
    reg_new_id bigint not null primary key autoincrement,
    token varchar(255) not null unique,
    user_email varchar(255) not null,
    user_name varchar(255),
    expire_ts timestamp not null,
    create_ts timestamp not null default current_timestamp
);

create table git_commit (
    commit_id bigint not null primary key autoincrement,
    external_id varchar(255) not null,
    message text not null,
    author_name varchar(255) not null,
    ts timestamp not null,
    commit_url varchar(255) not null,
    notification_id varchar(255) null
);

create table git_commit_task (
    task_id bigint not null references task(task_id) on delete cascade,
    commit_id bigint not null references git_commit(commit_id) on delete cascade,
    primary key (task_id, commit_id)
);

create table git_subscription (
    subscription_id bigint not null primary key autoincrement,
    provider varchar(255) not null,
    secret varchar(255) not null,
    subscription_uuid varchar(255) not null unique,
    active tinyint not null default 1
);
`
const rds = parseDdlToRds(input, { freeze: true, checkConsistency: true })
console.log(rds)
