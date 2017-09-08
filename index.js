let fs = require('fs');

let filePath= 'test.css'
let filePathOutput= 'output.css'
let removeDuplicates= true;

//let rootPath = process.argv[2];

fs.readFile(filePath,{encoding: 'utf-8'}, (err, data) => {
    if (err) throw err;
    refactorCSS(removeUnwantedTexts(data));
  });

function removeUnwantedTexts(cssString){

    const allLines = cssString.match(/^.+$/gm);
    let cleanString ='';
    let foundCommentedCode = false;

    for( let line of allLines){
        
        line = line.trim();

        if(!line || line.match(/\/\*.*\*\//)){
            continue;
        }

        if(!foundCommentedCode && line.match(/^(\/\*).*/)){
           foundCommentedCode = true;            
           continue;
        }

        if(foundCommentedCode && line.match(/.*$(\*\/)/)){
            foundCommentedCode = false;
            continue;
         }

        if (!foundCommentedCode) { cleanString += line };
    }

    return cleanString;
    
}  

function refactorCSS(cssString){

        cssString = cssString.trim().replace(/\s+/g, '`').replace(/(?:\r\n|\r|\n)/g, ''); // replacing all the spaces with ` to work on css

        let cssList = cssString.split('}'); // To split entire css string into individual blocks
        let individualBlockFromFile = [];
        for ( let each of cssList) {
            if (each && each.trim() != ' ') {
                individualBlockFromFile.push(each+'}'.trim());        
            }
        }

        let selectorCssMap = {};
        let allSelectors = [];
        //console.log(individualBlockFromFile);

        for ( let cssBlock of individualBlockFromFile) { //cssBlock is [.test{color: black;}]

            if(!cssBlock){
               continue;
            }
            //console.log(cssBlock);
            let cssSingleSelector = cssBlock.split('{'); //cssSingleSelector = .test
            if(!cssSingleSelector && cssSingleSelector.length != 2){
                continue;
             }
            let cssSingleSelectorContent = cssSingleSelector[1].replace('}',''); //cssSingleSelectorContent = color: black;
            cssSingleSelectorContent = cssSingleSelectorContent.replace(/\s+/g, '').replace(/ +/g, '').replace(/`/g, ' ').trim();
            cssSingleSelectorContent = cssSingleSelectorContent.split(';'); // cssSingleSelectorContent = [color: black]
            let selectorArray = cssSingleSelector[0].replace(/\s+/g, '').replace(/ +/g, '').replace(/`/g, ' ').trim().split(',');    
            selectorArray=selectorArray.map(x => x.trim());

            for ( let short of cssSingleSelectorContent) {
                
                if (short && short.trim()) {
                    
                    if(selectorCssMap.hasOwnProperty(short.trim())){
                        let styleArray=selectorCssMap[short.trim()];
                        selectorArray.push(...styleArray);
                    }
                        
                    selectorCssMap[short.trim()] = [...new Set(selectorArray)] ;  
        
                    allSelectors.push(...selectorArray);
                }            
            }    
        }
        console.log(selectorCssMap);
        let uniqueSelectors = [...new Set(allSelectors)];
        
        let optimizedCSS = removeDuplicates ? listTheDiff(selectorCssMap,uniqueSelectors) : getOptimizedCSS(selectorCssMap);

        //console.log(optimizedCSS);
        console.log(uniqueSelectors);
        
        listTheDiff(selectorCssMap,uniqueSelectors);
        writeCSS(filePathOutput, optimizedCSS);
}

function listTheDiff(selectorCssMap, uniqueSelectors){
    let selectorStyleMap = {};
    
    for (let selector of uniqueSelectors) {
        let styleArray = [];
        for (let key in selectorCssMap) {
            if(selectorCssMap[key].indexOf(selector) != -1) {
                styleArray.push(key);
            }
        }
        selectorStyleMap[selector]= styleArray;
    }
    return getOptimizedCSSDiff(selectorStyleMap);
}

function getOptimizedCSSDiff(selectorStyleMap){
    let optimizedCSS = '';
    for (var key in selectorStyleMap) {
    optimizedCSS +=
`${key}{
        ${selectorStyleMap[key].join(';\n        ')};
}
    `;
    
        }
    
        return optimizedCSS;
}

function getOptimizedCSS(selectorCssMap){
let optimizedCSS = '';
for (var key in selectorCssMap) {
optimizedCSS +=
`${selectorCssMap[key].join(', ')}{
        ${key};
}
`;

    }

    return optimizedCSS;
}


function writeCSS(filePathOutput, optimizedCSS){
    fs.writeFile(filePathOutput, optimizedCSS, function(err) {
        if(err) {
            return console.log(err);
        }
    
        //console.log("The file was saved!");
    });
}

// inspect --debug-brk index.js

// Find duplicate values from selectorCssMap, put it in an array 
// Find single values from selector and put in separatetly 