export default function decorate(block) {
    const image = block.querySelector('img');
    const heading = block.querySelector('h1');
    const subheading = block.querySelector('h2');
    const description = block.querySelector('p');
    const buttons = block.querySelectorAll('a.button');
  
    const container = document.createElement('div');
    container.className = 'pfizerhero-container';
  
    if (image) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'pfizerhero-image';
      imgWrapper.appendChild(image);
      container.appendChild(imgWrapper);
    }
  
    const textWrapper = document.createElement('div');
    textWrapper.className = 'pfizerhero-text';
  
    if (heading) textWrapper.appendChild(heading);
    if (subheading) textWrapper.appendChild(subheading);
    if (description) textWrapper.appendChild(description);
    buttons.forEach(button => textWrapper.appendChild(button));
  
    container.appendChild(textWrapper);
    block.textContent = '';
    block.appendChild(container);
  }
  