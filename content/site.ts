// ─────────────────────────────────────────────────────────────
//  All the words on the website live in this file.
//  Change the text between the quotes "like this" and save.
//  Anything marked PLACEHOLDER still needs real information.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: "Bawngkawn Corps",
  tagline: "The Salvation Army · Aizawl, Mizoram",

  hero: {
    titleLine1: "Come as you are,", // shown in normal style
    titleLine2: "leave with hope", // shown in italic light blue
    subtitle: "A family of faith in Bawngkawn, worshipping and serving together.",
  },

  quote: "We want to be a family where everyone can find a home, grow in faith, and serve our neighbours in Christ's name.", // PLACEHOLDER

  contact: {
    address: "Bawngkawn, Aizawl, Mizoram 796014", // PLACEHOLDER: add street / landmark
    phone: "+91 00000 00000", // PLACEHOLDER
    email: "bawngkawncorps@example.com", // PLACEHOLDER
    whatsapp: "", // PLACEHOLDER: e.g. "https://wa.me/910000000000"
    mapLink: "https://maps.google.com/?q=Salvation+Army+Bawngkawn+Aizawl+Mizoram+796014", // better: paste the corps' own Google Maps link
  },

  social: {
    youtube: "https://www.youtube.com/@BawngkawnCorps-mu3lf",
    instagram: "https://www.instagram.com/bawngkawn_corps/",
  },
};

// Weekly meetings. PLACEHOLDER times: please check them.
export const meetings = [
  { day: "Sunday", name: "Thianghlimna Inkhawm", time: "10:00 AM" },
  { day: "Sunday", name: "Sunday School", time: "12:00 PM" },
  { day: "Sunday", name: "Chhandamna Inkhawm", time: "7:15 PM" },
  { day: "Wednesday", name: "Sipai Inkhawm", time: "7:15 PM" },
  { day: "Saturday", name: "Tawngṭai Inkhawm", time: "7:15 PM" },
];

// Corps sections. Photos are in public/images/site/
export const groups = [
  { name: "Home League", image: "/images/site/group-home-league.jpg", text: "Fellowship, worship and service for the women of the corps." },
  { name: "Men's Fellowship", image: "/images/site/group-mens-fellowship.jpg", text: "The men of the corps, meeting for worship and fellowship, often with neighbouring corps." },
  { name: "Songsters", image: "/images/site/group-songsters.jpg", text: "Our choir, leading worship in song every Sunday." }, // PLACEHOLDER photo: still a stock image
  { name: "Brass Band", image: "/images/site/group-band.jpg", text: "Brass band ministry for meetings, marches and special days." },
  { name: "Salvation Army Youth", image: "/images/site/group-youth.jpg", text: "SAY: young people in the Fire, Holy and Blood brigades, growing in faith and friendship." },
  { name: "Corps Cadets", image: "/images/site/group-corps-cadets.jpg", text: "Bible study and leadership training for teenagers." },
  { name: "Junior Soldiers", image: "/images/site/group-junior-soldiers.jpg", text: "Children learning to know and follow Jesus." }, // PLACEHOLDER photo: still a stock image
];

// Missions: what the corps is doing for the community, shown on the Missions page and the home page.
// "album" is optional: part of a photo album's name. That album's first photo becomes the picture.
// PLACEHOLDER wording: please check each one and add the real ones.
export const missions = [
  { title: "Missionary campaigns", text: "Joint campaigns with neighbouring corps, taking the good news to villages and neighbourhoods.", album: "Missionary Campaign" },
  { title: "Caring for people in need", text: "Practical help and a listening ear for families and neighbours going through a hard time.", album: "" },
  { title: "Children and young people", text: "Junior Soldiers, Corps Cadets and SAY: helping the next generation know Jesus and serve others.", album: "Corps Sections" },
  { title: "Training leaders", text: "Bible study and leadership training so that our members are ready to serve.", album: "Leadership Training" },
];

// Giving. Leave a field empty and it is simply not shown. PLACEHOLDER: add the corps' real details.
export const give = {
  intro: "Your giving keeps our worship, our sections and our service to the community going. Thank you.",
  upi: "", // UPI ID, e.g. bawngkawncorps@oksbi
  accountName: "",
  bank: "",
  accountNumber: "",
  ifsc: "",
  note: "", // e.g. "Please write 'Offering' in the remarks."
};

// About page
export const about = {
  officers: [
    { role: "Corps Officer", name: "Captain ____" }, // PLACEHOLDER
    { role: "Corps Officer", name: "Captain ____" }, // PLACEHOLDER
  ],
  // Quick facts shown beside the story
  facts: [
    { label: "Territory", value: "India Eastern Territory · Headquarters in Aizawl" },
    { label: "Division", value: "Central North Division · Dawrpui, Aizawl" }, // division confirmed on the corps Instagram; CHECK the Dawrpui location
    { label: "Worship language", value: "Mizo" },
    { label: "In Mizoram since", value: "26 April 1917" },
    { label: "2026 theme", value: "Hmun a la awm · There's still room (Luke 14:22)" },
  ],
  history: [
    // PLACEHOLDER: the first paragraph is about Bawngkawn Corps itself. Add when it began and who started it.
    "Bawngkawn Corps is a local church of The Salvation Army in Bawngkawn, Aizawl, part of the Army's work in Mizoram for more than a hundred years. Today the corps gathers every Sunday for worship and serves the Bawngkawn community through its sections, outreach and practical care for people in need. Its sections include the Home League, Men's Fellowship, Songsters, Brass Band, Salvation Army Youth (SAY) and Corps Cadets, and it often holds joint fellowships and campaigns with neighbouring corps such as Dinthar, Zemabawk and New Mamit.",
    "The Salvation Army came to Mizoram through Kawlkhuma. In 1916 he and Chalchhuna travelled to Simla to find the Army and meet its leader in India, Commissioner Frederick Booth-Tucker. Chalchhuna died there, but Kawlkhuma completed officer training and arrived back in Aizawl on 26 April 1917, the day still kept as the Army's anniversary in Mizoram.",
    "The work kept growing, spreading to neighbouring states through hardship. It became a separate command on 1 June 1991 and the India Eastern Territory in 1993, with its headquarters in Aizawl, and celebrated its centenary in April 2017.",
  ],
  mission:
    "The Salvation Army, an international movement, is an evangelical part of the universal Christian Church. Its message is based on the Bible. Its ministry is motivated by the love of God. Its mission is to preach the gospel of Jesus Christ and to meet human needs in His name without discrimination.",
};
