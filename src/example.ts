import { parseDdl } from "./parse-ddl"

const input = `
-- COMMENT0
create table person(
  id int default 1, -- COMMENT1
  -- COMMENT2
  name varchar(50) unique not null default 'sam',
  birthdate date default current_date,
  note
    float(5)   -- note com 1
    foreign key --   note com 2
    references foo(bar), -- note com 3
  -- constraint com
  constraint u_birthdate unique(birthdate),
  constraint fk foreign key(name, note) references foo(bar, baz)
);

create index id1 on person(name);

alter table foo add constraint foreign key(bar) references baz(bak);

alter table foo add column bob int default 0 primary key;
`
const ast = parseDdl(input)
console.log(JSON.stringify(ast, undefined, 2))
