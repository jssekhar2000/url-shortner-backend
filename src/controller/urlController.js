const urlModel = require("../model/urlModel")
const shortId = require("shortid")
const validUrl = require("valid-url")
// const base = process.env.PORT

const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    14951,
    "redis-14951.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("L5yqDhOI1FMd2je3LWxV4ESAua90Mw0U", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});



//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//===============Validation Functions============================

const isValidRequest = function (reqBody) {
    return Object.keys(reqBody).length > 0;
}
const isValidValue = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    //if(typeof value === 'number') return false
    return true;
}

// const isValidUrl = function (url) {
//     const urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/
//     return urlRegex.test(url)
// }

//============= Create Short Url================================

const shortenUrl = async (req, res) => {
    try {
        let longUrl = req.body.longUrl
        //input validation
        if (!isValidRequest(req.body)) return res.status(400).send({ status: false, message: "No input by user" })

        if (!isValidValue(longUrl)) return res.status(400).send({ status: false, message: "longUrl is required." })


        //validation for Long Url
        if (!validUrl.isWebUri(longUrl.toString().trim())) return res.status(400).send({ status: false, message: "Long Url is invalid." })
        //if (!isValidUrl(longUrl)) return res.status(400).send({ status: false, message: "Long Url is invalid reg." })

        let baseUrl = "http://localhost:3000"

        // validation for base Url
        if (!validUrl.isWebUri(baseUrl)) return res.status(400).send({ status: false, message: `${baseUrl} is invalid base Url` })


        //if the Long url is already exist

        //  check for data in the cache
        let cachedlinkdata = await GET_ASYNC(`${req.body.longUrl}`)

        if (cachedlinkdata) {
            let change = JSON.parse(cachedlinkdata)
            return res.status(200).send({ status: true, redisdata: change })
        }

        // check for data in the Database
        const alreadyExistUrl = await urlModel.findOne({ longUrl: longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 })

        if (alreadyExistUrl) {
            //setting data in cache
            await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(alreadyExistUrl));
            return res.status(200).send({ status: true, message: "Shorten link already generated previously", data: alreadyExistUrl })
        } else {
            
            //Generating shortId
            let shortUrlCode = shortId.generate()

            //if the Urlcode is already exist
            const alreadyExistCode = await urlModel.findOne({ urlCode: shortUrlCode })
            if (alreadyExistCode) return res.status(400).send({ status: false, message: "It seems You Have To Hit The Api Again" })
            
            //formating shortUrl
            let shortUrl = baseUrl + '/' + shortUrlCode


            const generateUrl = {
                longUrl: longUrl,
                shortUrl: shortUrl,
                urlCode: shortUrlCode
            }


            let createUrl = await urlModel.create(generateUrl)

            // setting data in cache
            await SET_ASYNC(`${longUrl}`, JSON.stringify(generateUrl))

            return res.status(201).send({ status: true, message: "Short url Successfully created", data: generateUrl })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//===========================Get/:urlCode============================

const getUrl = async (req, res) => {
    try {
        let urlCode = req.params.urlCode

        //taking data from cache
        let cahcedUrlData = await GET_ASYNC(`${urlCode}`)

        let data = JSON.parse(cahcedUrlData);

        //if data present in cache
        if (cahcedUrlData) {
            res.status(302).redirect(`${data.longUrl}`)
        }
        else {

            //if data is not there in cache
            let urlData = await urlModel.findOne({ urlCode: urlCode })

            if (!urlData) {
                return res.status(400).send({ status: false, msg: "this short url does not exist please provide valid url code " })
            }

            //setting data in cache
            await SET_ASYNC(`${urlCode}`, JSON.stringify(urlData))

            return res.status(302).redirect(`${urlData.longUrl}`)
        }

    }
    catch (error) {
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { shortenUrl, getUrl } 