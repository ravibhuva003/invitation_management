const gujaratiToLatinMap = {
  'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'z', 'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n',
  'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n', 'પ': 'p', 'ફ': 'f', 'બ': 'b', 'ભ': 'bh', 'મ': 'm',
  'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v', 'શ': 's', 'ષ': 's', 'સ': 's', 'હ': 'h', 'ળ': 'l', 'ક્ષ': 'x', 'જ્ઞ': 'gn'
};

const digits = {
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', 
  '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9'
};

export const normalizeForSearch = (text) => {
  if (!text) return '';
  let str = '';
  for (let char of text) {
    if (gujaratiToLatinMap[char]) {
      str += gujaratiToLatinMap[char];
    } else if (digits[char]) {
      str += digits[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      str += char.toLowerCase();
    }
  }
  // Remove all vowels and spaces for a strict phonetic consonant match
  return str.replace(/[aeiou\s]/ig, '');
};

export const isPhoneticMatch = (source, query) => {
  if (!query) return true;
  if (!source) return false;
  
  const normalizedSource = normalizeForSearch(source);
  const normalizedQuery = normalizeForSearch(query);
  
  return normalizedSource.includes(normalizedQuery);
};
