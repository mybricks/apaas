
function green (text) {
  return `\u001b[32m${text}\u001b[0m`
}

function red (text) {
  return `\u001b[31m${text}\u001b[0m`
}

function yellow (text) {
  return `\u001b[33m${text}\u001b[0m`
}

module.exports = function log(prefix = '') {
  return {
    log: (text) => {
      console.log(green(prefix ? `[${prefix}] ${text}` : text, ));
    },
    warn: (text) => {
      console.log(yellow(prefix ? `[${prefix}] ${text}` : text, ));
    },
    error: (text) => {
      if (text && text.stack) {
        console.log(red(prefix ? `[${prefix}] ${text.stack.toString()}` : text.stack.toString(), ));
      }
      console.log(red(prefix ? `[${prefix}] ${text}` : text, ));
    }
  }
}