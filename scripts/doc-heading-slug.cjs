function headingSlug(heading) {
  const text = [];
  let position = 0;
  while (position < heading.length) {
    if (heading[position] === '<') {
      const tagEnd = heading.indexOf('>', position + 1);
      if (tagEnd === -1) {
        text.push(heading.slice(position));
        break;
      }
      position = tagEnd + 1;
    } else {
      text.push(heading[position]);
      position += 1;
    }
  }
  return text.join('').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[\p{P}\p{S}]/gu, character => character === '-' || character === '_' ? character : '').toLowerCase().replace(/ /g, '-');
}

module.exports = { headingSlug };
