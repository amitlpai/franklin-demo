import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h1');
  const description = block.querySelector('p');
  const buttons = block.querySelectorAll('a.button');

  const heroContainer = document.createElement('div');
  heroContainer.className = 'hero-container';

  const textContainer = document.createElement('div');
  textContainer.className = 'hero-text';

  if (heading) textContainer.appendChild(heading);
  if (description) textContainer.appendChild(description);
  buttons.forEach(button => textContainer.appendChild(button));

  if (picture) {
    const optimizedPicture = createOptimizedPicture(picture.src, picture.alt);
    heroContainer.appendChild(optimizedPicture);
  }

  heroContainer.appendChild(textContainer);
  block.textContent = '';
  block.appendChild(heroContainer);
}
