import WebSocket from 'ws';
import { Resolver } from 'node:dns';

const resolver = new Resolver();
resolver.setServers(['1.1.1.1']);

const CERTSTREAM_URL = "ws://localhost:8081"

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

const resolveDomain = (domain) => {
  resolver.resolve4(domain, (err, addresses) => {
    console.log(`domain: ${domain}`);
    console.log("addresses:");

    if (addresses) {
      addresses.forEach(a => console.log(a));
    } else {
      console.log("No addresses associated to this domain.")
    }
    
  });
}

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