const googleApi = require('./googleApi')

function beautify(wordData) {
  let result =''
  for(let i=0; i<wordData.length; i++) {
    for(let j=0; j<wordData[i].length; j++) {
      // console.log(wordData[i][j])
      result += wordData[i][j];
      if(j < wordData[i].length-1) {
        result += ', '
      }
    }
  }
  return result
}

function makeButtonArray(wordData) {
  let btnNum = 5; // also represent words count
  // let limitedArr = wordData[0];
  let limitedArr = wordData[0].filter((el, index) => index < btnNum)
  let arr = limitedArr.map((el, index) => {
    console.log(index, el, `${index+1}. `.concat(el))
    return `<${index+1}> `.concat(el)
    // return `<<@@>> `.concat(el)
  })
  arr.push('# HOME')
  return arr
}

function makeData(wordData, num) {
  console.log('ma',wordData, num)
  let newWordData = [[]];
  newWordData[0][0] = num ? wordData[0][parseInt(num)+4] : wordData[0][0]; // magic number 4 = 일일 리뷰할 표현 갯수 - 1
  let beatifiedData = beautify(newWordData)
  var btnArr = makeButtonArray(wordData)
  var data = {
    "message": {
      "text": beatifiedData,    
    },
    "keyboard": {
      "type": "buttons",
      "buttons": btnArr
    }
  }
  // console.log(data)
  return data
}


exports.handler = async (event) => {
  if(event.content=='# Get key' || event.content=='# HOME') {
    return {
      "message": {
        "text": event.user_key,    
      },
      "keyboard": {
        "type": "buttons",
        "buttons": ["# My Note", "# Go Magazine", "# Get key"]
      }
    }
  } else if (event.content=='# Go Magazine') {
    console.log('# Go Magazine', megazineStaticData)
    return megazineStaticData;
  } else if (event.content.startsWith('<')) {
    var raw_word = event.content.replace('<','').replace('> ','');
    // console.log('raw_word',raw_word)
    var num = raw_word.substring(0,1)
    // console.log('num',num)
    var cellNumArr = ['J', 'K', 'L', 'M', 'N'] // 예문이 기록된 셀 rows
    try {
      let data = await googleApi.getData(event.user_key, `!E2:${cellNumArr[parseInt(num)-1]}2`)
      return makeData(data, num)
    } catch (err) {
      console.log('err',err)
      return {
        "message": {
          "text": word
        },
        "keyboard": {
          "type": "buttons",
          "buttons": ["# My Note", "# Go Magazine", "# Get key"]
        }
      }
    }
  } else { 
    try {       
      let data = await googleApi.getData(event.user_key, '!E2:I2')
      // console.log('list',response.data.values)
      return makeData(data)
    } catch (err) {
      console.log('err',err)
    }
  }

};

const megazineStaticData = {
  "message": {
    "text": "Talking Magazine",    
    "photo": {
      "url": "http://newpouypekr.cafe24.com/wp-content/uploads/2018/06/test-780x439.jpg",
      "width": 640,
      "height": 480
    },
    "message_button": {
      "label": "Go Talking",
      "url": "http://newpouypekr.cafe24.com/"
    }
  },
  "keyboard": {
    "type": "buttons",
    "buttons": ["# My Note", "# Go Magazine", "# Get key"]
  }
}