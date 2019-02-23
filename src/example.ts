import { parseDdl } from "./parse-ddl"

const input = `
create table person(
  id int default 1,
  name varchar(50) unique not null default 'sam',
  birthdate date default current_date,
  note float(5) foreign key references foo(bar),
  constraint u_birthdate unique(birthdate),
  constraint fk foreign key(name, note) references foo(bar, baz)
);
`
const ast = parseDdl(input)
console.log(JSON.stringify(ast, undefined, 2))
