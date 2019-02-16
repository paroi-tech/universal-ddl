import { parseDdl } from "./parse-ddl"

const input = `
create table person(
  id int primary key,
  name varchar(50) unique not null default 'sam',
  birthdate date default current_date,
  note float(5) foreign key references foo(bar)
);
`
const ast = parseDdl(input)
console.log(JSON.stringify(ast, undefined, 2))
