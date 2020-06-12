const request = require('request');
const cheerio = require('cheerio')
const moment = require('moment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var start = '';
const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
      {id:'id', title: 'id'},
      {id:'rideId', title: 'rideId'},
      {id:'rideName', title: 'rideName'},
      {id:'status', title: 'Status'},
      {id: 'waitTime', title: 'waitTime'},
      {id: 'waitTimeDate', title: 'waitTimeDate'},
      {id: 'open', title: 'open'},	
      {id: 'timestamp', title: 'timestamp'},	
      {id: 'hourOfDay', title: 'hourOfDay'},	
      {id: 'dayOfWeek', title: 'dayOfWeek'},	
      {id: 'dayOfWeekName', title: 'dayOfWeekName'},	
      {id: 'dayOfYear', title: 'dayOfYear'},	
      {id: 'dayOfMonth', title: 'dayOfMonth'}
  
    ]
  });
let csvData = [];

request('http://api.scrapestack.com/scrape?access_key=db1e03753237c03082a249ce4a49dec7&url=https://www.thrill-data.com/waits/attraction/dollywood/wildeagle/2019/07/4', { json: false }, (err, res, body) => {
  if (err) { return console.log(err); }
    //   console.log(body.url);
    //   console.log(res.body);
    const $ = cheerio.load(res.body);
    
    //   const text = $('script').get()[12].children[0].data;
    const elTest = $('.plot-area script').get()[0].children; 
    //   console.log('elTest', elTest[0].data);
    var matchX = elTest[0].data.match(/var docs_json = (.*)}}';/g);
    var data=matchX[0];
    console.log('matchX', data);
    data=data.replace("var docs_json = '","");
    data=data.replace("';","");
    data=data.trim();
    // console.log('matchX', data);
    let fullObject=JSON.parse(data);
    console.log('final', fullObject);

    
    for (item1 in fullObject) {
    for (subItem in fullObject[item1]) {
        // console.log(subItem);
        if(subItem=="roots") {
            let a=fullObject[item1][subItem];// references
            let lastdata=a.references;
            // console.log(lastdata);
            let sourceId=0;
            lastdata.map((i)=>{
                if(i.attributes.name=="Past Wait") {
                    sourceId=i.attributes.data_source.id;
                    console.log('sourceid',sourceId);
                }
                if(sourceId > 0 && i.id==sourceId) {
                    console.log('data is',i.attributes.data);
                    const mainData = i.attributes.data;
                    const time=mainData.time;
                    const x=mainData.x;
                    const y=mainData.y;
                    
                    let previousHour=0;
                    time.map((item,i)=>{
                        // console.log('item',item);
                        var spt = item.split(':');
                        if(previousHour != spt[0]) {
                        console.log('Hour ',spt[0]);
                        // console.log(' with index ',i);
                        console.log('having Wait time ',y[i]);
                        
                        let timestamp=x[i];
                        timestamp = timestamp.toString().substring(10, 0);
                        // console.log('timestamp',timestamp);
                        console.log(' and timestamp is ',moment.unix(timestamp).format("DD-MM-YYYY hh:mm:ss"));
                        
                        const hour = spt[0];
                        const waitTime =y[i];

                        csvData.push(
                            {
                              id: 0,
                              rideId: 0,
                              rideName: '',
                              status: 'OPEN',
                              waitTime: waitTime,
                              waitTimeDate: '',
                              open: 1,	
                              timestamp: moment.unix(timestamp).format("DD-MM-YYYY hh:mm:ss"),	
                              hourOfDay: hour,	
                              dayOfWeek: moment.unix(timestamp).format("d"),	
                              dayOfWeekName: moment.unix(timestamp).format("dddd"),	
                              dayOfYear: moment.unix(timestamp).dayOfYear(),	
                              dayOfMonth:moment.unix(timestamp).date()
                            }
                            );


                        previousHour=spt[0];
                        }
                    });
                    if(csvData.length>0) {
                        csvWriter
                        .writeRecords(csvData)
                        .then(()=> console.log('Data has been written to CSV file'));
                    }
                    sourceId=0;
                }    
            });
        }   
    }
    }
});

console.log('running', start);
