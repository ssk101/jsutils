(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.jsutils = factory());
}(this, (function () { 'use strict';

  function probability(percentage = 50) {
    return Math.random() <= percentage / 100
  }

  function randomItems(arr, amount = 1, probabilities = {}) {
    if(!amount) return

    const ret = [];

    const pickItem = () => {
      for(const i in [...Array(amount).keys()]) {
        const picked = arr[Math.floor(Math.random() * (arr.length))];

        if(probabilities[picked]) {
          if(!probability(probabilities[picked])) {
            arr = arr.filter(item => item !== picked);
            return pickItem()
          }
        }

        ret.push(picked);
      }
    };

    pickItem();

    if(amount === 1) return ret[0]
    return ret
  }

  function jsonToCSS(json) {
    return Object.keys(json).reduce((acc, tag) => {
      acc += tag;
      acc += JSON.stringify(json[tag])
        .replace(/"/g, '')
        .replace(/,/g, ';');
      return acc
    }, '')
  }

  function varsToHex(obj, raw) {
    return Object.keys(obj).reduce((acc, val) => {
      acc[val] = +`0x${+raw[`--${obj[val]}`].replace(/#/, '')}`;
      return acc
    }, {})
  }

  function PrettyDate(v) {
    const pad = (v) => String(v).padStart(2, 0);

    const date = new Date(v);

    return [
      date.getFullYear(),
      '/',
      date.getMonth() + 1,
      '/',
      date.getDate(),
      ' ',
      pad(date.getHours()),
      ':',
      pad(date.getMinutes()),
    ].join('')
  }

  async function imgFromBlob(blob) {
    if(!blob) return ''

    const reader = new FileReader();

    reader.readAsDataURL(blob);

    return new Promise(resolve => {
      reader.onloadend = () => resolve(reader.result);
    })
  }

  function imgFromBuffer(buffer, type = 'png') {
    if(!buffer) return ''

    const base64 = (() => {
      if(typeof btoa === 'function') {
        return btoa(
          buffer.data.reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
      }
      return Buffer.from(buffer).toString('base64')

    })();

    return `data:image/${type};base64,${base64}`
  }

  function resizeWithAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return {
      width: srcWidth * ratio,
      height: srcHeight * ratio,
    }
  }

  function imgToDataUri(src, maxWidth, maxHeight, keepAspect = true) {
    if(typeof document === 'undefined') {
      throw new Error('Must run in browser context')
    }

    return new Promise(resolve => {
      const draw = (srcWidth, srcHeight) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const dimensions = [ maxWidth || srcWidth, maxHeight || srcHeight ];

        Object.assign(
          canvas,
          keepAspect
            ? resizeWithAspectRatio(srcWidth, srcHeight, dimensions[0], dimensions[1])
            : { width: dimensions[0], height: dimensions[1] }
        );

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL()
      };

      const img = new Image;
      img.src = src;

      img.onload = () => {
        resolve(draw(img.width, img.height));
      };
    })
  }

  function clamp(val, min, max) {
    return Math.max(+min, Math.min(+val, +max))
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  function sentenceCase(str) {
    str || (str = '');
    return str
      .replace(/([A-Z])/g, (_, match) => ' ' + match.toLowerCase())
      .replace(/[_\- ]+(.)/g, ' $1')
      .trim()
  }

  function camelCase(str) {
    return sentenceCase(str)
      .replace(/\s(.)/g, (_, match) => match.toUpperCase())
  }

  function camelKeys(o, seen = []) {
    if(~seen.indexOf(o)) return o

    seen.push(o);

    if(Array.isArray(o)) {
      o.forEach(o => camelKeys(o, seen));
    } else if(typeof o === 'object') {
      Object.keys(o).forEach(key => {
        var value = camelKeys(o[key], seen);
        delete o[key];
        o[camelCase(key)] = value;
      });
    }
    return o
  }

  function camelize(obj) {
    if(Array.isArray(obj)) {
      return obj.map(v => camelize(v))
    } else if(obj != null && obj.constructor === Object) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [camelCase(key)]: camelize(obj[key]),
        }),
        {},
      )
    }
    return obj
  }

  function kebabCase(str) {
    return sentenceCase(str).replace(/[ ]/g, '-')
  }

  function objectToStyle(obj) {
    if(!obj) return ''
    if(typeof obj === 'string') {
      return obj
    }

    return Object.keys(obj).reduce((acc, tag) => {
      const value = obj[tag];
      if(typeof value === 'object' && value !== null) {
        acc += `${tag} {\n${objectToStyle(value)}}\n`;
      } else {
        if(!tag.startsWith('--')) {
          tag = kebabCase(tag);
        }
        acc += `${tag}: ${value};\n`;
      }
      return acc
    }, '')
  }

  /**
   * Creates a Proxy from an object and assigns a non-enumerable array that
   * contains the parent path (parent keys) to nested objects or functions.
   * @param  {} wrapped
   * @param  {} path=[]
   */

  function objectWithPath(wrapped, path = []) {
    return new Proxy(wrapped, {
      get(target, prop, value) {
        if(typeof target[prop] === 'object') {
          Object.defineProperty(target[prop], 'parentPath', {
            get: () => path,
          });
          return objectWithPath(target[prop], path.concat([ prop ]))
        } else if(typeof target[prop] === 'function') {
          return target[prop].bind({
            get parentPath() { return path },
            ...target,
          })
        }
        return target[prop]
      },
    })
  }

  function humanCase(str) {
    str || (str = '');
    return str
      .replace(/([A-Z])/g, (_, match) => ' ' + match.toLowerCase())
      .replace(/[_\- ]+(.)/g, ' $1')
      .trim()
      .split(' ')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ')
  }

  function snakeCase(str) {
    return sentenceCase(str).replace(/[ ]/g, '_')
  }

  function validURL(s = '') {
    const REGEX = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
    return s.match(REGEX)
  }

  var umd = {
    randomItems,
    jsonToCSS,
    varsToHex,
    PrettyDate,
    imgFromBlob,
    imgFromBuffer,
    imgToDataUri,
    resizeWithAspectRatio,
    clamp,
    probability,
    randomInt,
    camelKeys,
    camelize,
    objectToStyle,
    objectWithPath,
    camelCase,
    humanCase,
    kebabCase,
    sentenceCase,
    snakeCase,
    validURL,
  };

  return umd;

})));