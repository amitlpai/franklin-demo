export default function decorate(block) {
  const columns = [...block.firstElementChild.children];
  block.classList.add(`columns-${columns.length}-cols`);

  columns.forEach((column) => {
    column.classList.add('nurteccolumn');
  });
}
