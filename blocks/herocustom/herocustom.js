import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  debugger;
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h1');
  const description = block.querySelector('p');
  const buttons = block.querySelectorAll('a.button');

  const herocustomContainer = document.createElement('div');
  herocustomContainer.className = 'herocustom-container';

  const textContainer = document.createElement('div');
  textContainer.className = 'herocustom-text';

  if (heading) textContainer.appendChild(heading);
  if (description) textContainer.appendChild(description);
  buttons.forEach(button => textContainer.appendChild(button));

  if (picture) {
    const optimizedPicture = createOptimizedPicture(picture.src, picture.alt);
    herocustomContainer.appendChild(optimizedPicture);
  }

  herocustomContainer.appendChild(textContainer);
  block.textContent = '';
  block.appendChild(herocustomContainer);
}
