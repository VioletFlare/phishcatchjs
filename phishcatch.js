import fs from "fs";
import WebSocket from 'ws';
import { Resolver } from 'node:dns';
import ipRangeCheck from 'ip-range-check';

const CERTSTREAM_URL = "ws://localhost:8081"
const DNS_SERVER = '1.1.1.1'

//just Cloudflare for now
const BLACKLISTED_IP_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22"
];

/*
const SUS_TLDS = [
  ".simp.com",
  ".lol.com",
  ".rock.com",
  "simp",
  ".icu",
  ".ml",
  ".py",
  ".tk",
  ".xn--2scrj9c",
  ".xn--5tzm5g",
  ".xn--6frz82g",
  ".xn--czrs0t",
  ".xn--fjq720a",
  ".xn--s9brj9c",
  ".xn--unup4y",
  ".xn--vhquv",
  ".xn--xhq521b",
  ".xyz",
  ".am",
  ".bd",
  ".best",
  ".bid",
  ".cd",
  ".cfd",
  ".cf",
  ".click",
  ".cyou",
  ".date",
  ".download",
  ".faith",
  ".ga",
  ".gq",
  ".help",
  ".info",
  ".ke",
  ".loan",
  ".men",
  ".porn",
  ".pw",
  ".quest",
  ".rest",
  ".review",
  ".sbs",
  ".sex",
  ".su",
  ".support",
  ".win",
  ".ws",
  ".xn--*",
  ".xxx",
  ".zip",
  ".zw",
  ".asia",
  ".autos",
  ".bar",
  ".bio",
  ".blue",
  ".buzz",
  ".casa",
  ".cc",
  ".cfd",
  ".charity",
  ".club",
  ".country",
  ".dad",
  ".degree",
  ".earth",
  ".email",
  ".fit",
  ".fund",
  ".futbol",
  ".fyi",
  ".gdn",
  ".gives",
  ".gold",
  ".guru",
  ".haus",
  ".homes",
  ".id",
  ".in",
  ".ink",
  ".jetzt",
  ".kim",
  ".lat",
  ".life",
  ".live",
  ".lol",
  ".ltd",
  ".makeup",
  ".mom",
  ".monster",
  ".mov",
  ".ninja",
  ".online",
  ".pics",
  ".plus",
  ".pro",
  ".pub",
  ".racing",
  ".realtor",
  ".ren",
  ".rip",
  ".rocks",
  ".rodeo",
  ".run",
  ".shop",
  ".skin",
  ".space",
  ".support",
  ".tokyo",
  ".uno",
  ".vip",
  ".wang",
  ".wiki",
  ".work",
  ".world",
  ".xin",
  ".zone",
  ".accountant",
  ".accountants",
  ".adult",
  ".adult",
  ".bet",
  ".cam",
  ".casino",
  ".cm",
  ".cn",
  ".cricket",
  ".ge",
  ".il",
  ".link",
  ".lk",
  ".me",
  ".ng",
  ".party",
  ".pk",
  ".poker",
  ".ru",
  ".sa",
  ".science",
  ".sexy",
  ".site",
  ".stream",
  ".th",
  ".tn",
  ".top",
  ".trade",
  ".tube",
  ".webcam",
  ".webcam",
  ".wtf"
]*/

const SUS_TLDS = [
  ".lol",
  ".ly",
  ".to"
]

const resolver = new Resolver();
resolver.setServers([DNS_SERVER]);

let IPToDomain = {};

const main = () => {
  fs.access('ip-to-domain-sus.json', fs.constants.F_OK, (err) => {

    const saveLoadedPromise = new Promise((resolve) => {
      if (err) {
        console.log("Save file doesn't exist. It will be created.")
        resolve();
      } else {
        console.log("Save file found. Loading.")
        loadSave(resolve);
      }
    })

    saveLoadedPromise.then(() => startConnectionToCertstream());
  });
}

const loadSave = (resolve) => {
  fs.readFile('ip-to-domain-sus.json', 'utf8', (err, data) => {
    IPToDomain = JSON.parse(data);

    if (err) {
      console.error(err);
      return;
    }

    resolve();
  });
}

const resolveDomain = (domain) => {
  resolver.resolve4(domain, (err, addresses) => {

    if (addresses) {
      addresses.forEach(ip => {

        if (!ipRangeCheck(ip, BLACKLISTED_IP_RANGES)) {
          if (!IPToDomain[ip]) {
            IPToDomain[ip] = [];
          }
  
          if (!IPToDomain[ip].includes(domain)) {
            IPToDomain[ip].push(domain);
          }
        }

      });
    }

    fs.writeFile('ip-to-domain-sus.json', JSON.stringify(IPToDomain, null, 2), err => {
      if (err) {
        console.error(err);
      } else {
        console.log("File updated: ip-to-domain-sus.json")
      }
    });

  });
}

const startConnectionToCertstream = () => {
  const ws = new WebSocket(CERTSTREAM_URL);

  ws.on('error', console.error);

  ws.on('message', (data) => {
    const resStr = data.toString("utf-8");
    const certObj = JSON.parse(resStr);

    SUS_TLDS.forEach(tld => {
      const examinedCN = certObj.data.leaf_cert.subject.CN;

      if (examinedCN.endsWith(tld)) {
        resolveDomain(examinedCN);
      }
    })
  });

  //ping the certserver every 30s to maintain connection as specified on gh page
  setInterval(() => {
    ws.ping();
  }, 30000);
}

main();