file = require('fs')
file.readFile('./input.csv', 'utf8', (error, data) => {
    try {
        main(data)
    }
    catch {
        console.log(error)
    }
})

const main = (csvList) => {

    const object = toJsonFormat(
        objectFormat(
            arrayToObject(
                stringToArray (csvList)
            )
        )
    )

    const json = JSON.stringify(object, null, 2)
    
    file.writeFile('output.json', json, 'utf8', (error) => {
        if (error) {
            return console.log(error)
            }
        })
    }

const toJsonFormat = (arr) => {
    result = []
    for (item of arr) {  
        allKeys = Object.keys(item)
        let addrs = []
        let obj = {}
        for (let key of allKeys) {
            if (key.split(' ').includes('phone') || key.split(' ').includes('email')) {
                for (let i of item[key]) {

                    const infos = key.split(' ')
                    let value;

                    if (key.split(' ').includes('phone')) {
                        value = formatPhone(i)
                    }
                    else {
                        value = i
                    }

                    addrs.push({
                        type: infos[0],
                        tags: infos.slice(1),
                        address: value
                        }
                    )
                }
            }
            else if (key.split(' ').includes('group')) {
            
                let group = []
                for (let i of item[key]) {
                    group = group.concat(i)
                }
                group = [... new Set(group.join('')
                .split('"')
                .join('/')
                .split('/')
                .map(a => {return a.trim()})
                .filter(a => {return a != ''})
                    )
                ]
                obj.groups = group
            }
            else if (key.split(' ').includes('fullname')){
                obj[key] = item[key][0]
            }
            else if (key.split(' ').includes('eid')) {
                obj[key] = item[key][0]
            }
            else {
                if (['yes','1',1,true].includes(item[key][0])) {
                    obj[key] = true
                } else {
                    obj[key] = false
                }
            }
            obj.addresses = addrs
            
        }
        result.push(obj)
    }
    return result
}

const stringToArray = (item) => {
    let info = []
    let index = 0
    index = item.indexOf('"', index + 1)
    let result = item
    while (index !== -1) {

        let futIndex = item.indexOf('"', index + 1)
        
        const replacement = item.slice(index, futIndex + 1).replace(",","/")
        const location = [index, futIndex]

        info.push([location, replacement])

        index = item.indexOf('"', futIndex + 1)
    }
    
    for (let i of info) {
        result = result.slice(0,i[0][0]) + i[1] + result.slice(i[0][1] + 1, result.length)
    }

    result = result.split('\n').map((value) => {return value.split(',')})

    if (result[-1] === undefined) {
        result.pop()
    }

    for (let a = 0; a < result.length; a++)  
        if (result[a] == undefined) {
            result.splice(a,1)
            a = -1
            continue
        }
    return result
}


const arrayToObject = (arrList) => {

    const ref = arrList[0]
    let result = []

    for (let i = 1; i < arrList.length; i++ ) {
        let item = {}
        for (let j = 0; j < arrList[0].length; j++) {
            if (item[ref[j]] === undefined ) {
                item[ref[j]] = arrList[i][j]
            }
            else {
                item[ref[j]] += '/' + arrList[i][j]
            }

        }
        result.push(item)
        }
    return result
}

const objectFormat = (arr) => {
    const ids = arr.map((item) => {return item.eid})
    let result = []
    for (let i in ids) {
        const item = arr.filter((item) => item.eid === ids[i])

        let obj = {}

        const allKeys = Object.keys(item[0])
        if (item.length > 1) {

            for (let key of allKeys) {
                const keyObj = key.split('"').join('')
                const values = [... new Set(item.map((j) => {return j[key]}))]
                obj[keyObj] = validateInfo(keyObj, values)
                
            }
            result.push(obj)
        }
        else {
            for (let key of allKeys) {
                const keyObj = key.split('"').join('')
                const values = [... new Set(item.map((j) => {return j[key]}))]
                obj[keyObj] = validateInfo(keyObj, values)
            }
            result.push(obj)
        }
    }
    return removeEqual(result)
}



const validateEmail = (email) => {
    const regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return email.match(regEx)
}

const formatPhone = (phone) => {
    return "55" + phone
}

const validatePhone = (phone) => {
    const regEx = /^\+?([0-9]{11})/
    return phone.match(regEx)
}

const validateInfo = (key, values) => {
    if (key.split(' ').includes('email')) {

        const value = values.map(i => i
        .split(' ')).join()
        .split('/').join(',')
        .split(',')
        .filter((i) => validateEmail(i))
        return value
    }

    else if (key.split(' ').includes('phone')) {
        const value = values.map((i) => {return i.replace('(','')
        .replace(')','')
        .replace("-",'')
        .split(" ")
        .join('')})
        .filter((i) => validatePhone(i))
        return value
    }

    else {
        return values
    }
}

const removeEqual = (arr) => {
    const eids = arr.map((item) => {return item.eid[0]})
    const uniquesEids = [... new Set(eids)]
    result = []
    for (let id of uniquesEids) {
        const helper = arr.filter((item) => item.eid[0] === id)
        result.push(helper[0])
    }
    return result
}