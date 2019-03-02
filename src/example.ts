import { generateDdl, parseDdl } from "./index"

const input = `
-- COMMENT0
-- COMMENT0 bis
create table person( -- boo
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
  -- bah
);

create index id1 on person(name);

-- alter com1
-- alter com2
alter table foo add
  -- yoo
  constraint
  -- moko
  foreign key(bar) references baz(bak);

alter table foo add column bob int default 0 primary key; -- jojo

create table t2 (
  a integer not null autoincrement primary key,
  b varchar(255) not null
);
`
const ast = parseDdl(input, { freeze: true })
console.log(JSON.stringify(ast, undefined, 2))

console.log("\n\n-------- Universal DDL --------")
console.log(generateDdl("UniversalDdl", ast))

console.log("\n\n-------- Postgresql DDL --------")
console.log(generateDdl("Postgresql", ast))