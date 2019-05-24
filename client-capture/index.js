
const loaderUtils = require('loader-utils');
const getOptions = loaderUtils.getOptions;

const regionStartTag = new RegExp('#region');
const regionEndTag = new RegExp('#endregion');

function getLineTags(lineStr) {
  const lineTags = lineStr.replace(/(\/|#region|\*)/gi, '');
  return lineTags.split('|').reduce((a, c) => {
    const tag = c.trim();
    if (tag.length) a.push(tag.toLowerCase());
    return a;
  }, [])
}


function createSourceWithoutTags(source, fileName, clientName) {
  /*
  * Ensure correct tag order and nesting exists whilst running through code lines.
  * builds new source code array as it runs, only including lines between corrects region tags
  */
  const newSource = [];
  let error = false;
  let regionTagOrder = [];
  const sourceLines = source.split('\n');
  let includeLineInSource;
  let includedRegion = [true];
  for (let i = 0; i < sourceLines.length; i++) {
    includeLineInSource = true;
    const line = sourceLines[i];
    if (line.search(regionStartTag) > -1) {
      includeLineInSource = false; // region tag - ignore this line
      const startLineTags = getLineTags(line);
      includedRegion.push(startLineTags.includes(clientName)); // region must be included in bundle
      if (regionTagOrder.length === 0) { //not nested
        regionTagOrder.push(startLineTags);
      } else { //nested - test tag is valid within surrounding region
        const surroundingRegionTags = regionTagOrder[regionTagOrder.length - 1];
        const nestedTagsExistInSurroundingRegion = startLineTags.reduce((acc, curr) => {
          if (!acc) return acc;
          return surroundingRegionTags.includes(curr);
        }, true);
        if(nestedTagsExistInSurroundingRegion) {
          regionTagOrder.push(startLineTags);
        } else {
          error = `ERROR: (${i + 1}): Nested #region: ${line} \n This child #region is surrounded by a parent #region without sufficient clients, unreachable code`;
          break;
        }
      }
    } else if (line.search(regionEndTag) > -1) {
      includeLineInSource = false; // endregion tag - ignore this line
      includedRegion.pop();
      if (regionTagOrder.length === 0) {
        error = `ERROR: (${i + 1}): Unbalanced region tags, found #endregion without start #region`;
        break;
      } else {
        regionTagOrder.pop();
      }
    }
    if (!includedRegion.length) {
      error = `ERROR: (${i + 1}): Unbalanced region tags, unable to decipher if code should be included or not`;
      break;
    }
    if (includeLineInSource && (includedRegion[includedRegion.length - 1])) {
      newSource.push(line);
    } else {
      newSource.push('');
    }
  }
  if (!error && regionTagOrder.length !== 0) { // check final #endregion exists
    error = `ERROR: Unbalanced region tags #region.length !== #endregion.length`;
  }
  return {
    error,
    source: newSource.join('\n')
  };
}

module.exports = function(source, map) {

  const options = getOptions(this);
  const clientName = options.client;
  const newSource = createSourceWithoutTags(source, this.resourcePath, clientName);
  if (newSource.error) {
    return this.callback(new Error(newSource.error), null, null);
  }
  return this.callback(null, newSource.source, map);
};
