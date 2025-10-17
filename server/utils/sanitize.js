const sanitize = (str) => {
  if (str && typeof str === 'string' && ['=', '+', '-', '@'].includes(str.charAt(0))) {
    return `'${str}`;
  }
  return str;
};

module.exports = {
  sanitize,
};