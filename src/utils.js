function getProp(object, keys, defaultVal) {
  keys = Array.isArray(keys) ? keys : keys.split(".");
  object = object[keys[0]];
  if (object && keys.length > 1) {
    return getProp(object, keys.slice(1));
  }
  return object === undefined ? defaultVal : object;
}

function getTypeDirectiveArgumentValue (
  directives,
  directiveToCheck,
  argumentName,
  defaultValue = null,
) {
  let argumentValue = defaultValue;
  if (directives && directives.length) {
    directives.forEach((directive) => {
      const directiveName = directive && directive.name.value;
      if (
        directiveName === directiveToCheck
        && get(directive, 'arguments', []).length
      ) {
        const argumentsArr = get(directive, 'arguments', []);
        const argument = argumentsArr.filter(
          (arg) => get(arg, 'name.value') === argumentName,
        )[0];
        if (argument) {
          if (get(argument, 'value.values', []).length) {
            argumentValue = get(argument, 'value.values', []).map((value) => value.value);
          } else {
            argumentValue = get(argument, 'value.value');
          }
        }
      }
    });
  }
  return argumentValue;
};

module.exports = {
  get: getProp,
  getTypeDirectiveArgumentValue,
};