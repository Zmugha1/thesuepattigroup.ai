// TO UPDATE A LISTING: edit this file only.
// Change headline, status, cta, or price here.
// No other files need to be touched.
// After editing, commit and push to go live.
//
// status values: "active" | "under_contract" | "sold"
// featured: true marks the Coming Soon estate-style card
// showOn: which pages render this listing ("home" = Coming Soon, "search" = Search page)

window.LISTINGS = [
  {
    id: "alberta",
    address: "N6W31264 Alberta Drive, Delafield",
    price: "$795,000",
    status: "active",
    headline: "SHOWINGS BEGIN JUNE 20",
    subheadline: "Beautifully updated Colonial in Carlton Ridge. Spacious primary suite with walk-in shower and soaking tub. Walkout lower level with rec room and additional den. 2.5 car attached garage plus a 32x30 fully insulated heated detached garage with finished upper level. Kettle Moraine school district.",
    cta: "Request Private Preview",
    image: "images/listings/alberta-dr.jpg",
    imageAlt: "Updated Colonial home at twilight on 1.86 wooded acres, N6W31264 Alberta Drive, Delafield Wisconsin",
    ctaHref: "contact.html?listing=alberta",
    featured: false,
    showOn: ["home"],
    specs: [
      { label: "bd", value: "3" },
      { label: "ba", value: "2.5" },
      { label: "sqft", value: "3,721" },
      { label: "acres", value: "1.86" }
    ],
    features: ["Hot Tub", "Cold Plunge", "Heated Detached Garage", "Kettle Moraine Schools"]
  },
  {
    id: "stonebrook",
    address: "S16W32772 Highway 18, Delafield",
    price: "$2,200,000",
    status: "active",
    headline: "SHOWINGS BEGIN JUNE 23  ·  ESTATE",
    subheadline: "Historic 1885 Stonebrook Estate Farmstead. Two distinct residences on 7+ acres along Scuppernong Creek. Main home features 5 bedrooms, 4 full plus 2 half baths, and three natural fireplaces. Charming secondary home with 2 bedrooms. Premium outbuildings including barn with box stalls, guest house, and pole building. Borders public land. Ideal for family compound, private retreat, or hosting venue.",
    cta: "Request Private Preview",
    image: "images/listings/stonebrook.jpg",
    imageAlt: "Aerial view of the historic 1885 Stonebrook Estate farmstead, main stone house with red barn and guest house on 7.08 acres along Scuppernong Creek, Delafield Wisconsin",
    ctaHref: "contact.html?listing=stonebrook",
    tagline: "The 1885 Stonebrook Estate",
    featured: true,
    showOn: ["home"],
    specs: [
      { label: "bd", value: "5" },
      { label: "ba", value: "4.5" },
      { label: "sqft", value: "5,750" },
      { label: "acres", value: "7.08" }
    ],
    features: [
      "Two Homes On Property",
      "Hobby Farm Approved",
      "Scuppernong Creek",
      "Borders Public Land",
      "Kettle Moraine Schools"
    ]
  },
  {
    id: "mill-pond",
    address: "760 Mill Pond Rd, Dousman, WI 53118",
    price: "$764,900",
    status: "active",
    headline: "For Sale",
    subheadline: "Listed by The Sue Patti Group. Single-family home in Dousman, Waukesha County. 5 bedrooms, 4 bathrooms. Contact us for showings, full details, and to schedule a tour.",
    cta: "Request Tour",
    image: "https://photos.zillowstatic.com/fp/08ebb5f61e69cf522ee84c4ac183fe42-p_d.jpg",
    ctaHref: "contact.html",
    secondaryCta: "View Full Listing on Zillow →",
    secondaryCtaHref: "https://www.zillow.com/homedetails/760-Mill-Pond-Rd-Dousman-WI-53118/119551108_zpid/",
    featured: false,
    showOn: ["search"],
    specs: [
      { label: "Bedrooms", value: "5" },
      { label: "Bathrooms", value: "4" },
      { label: "Family Home", value: "Single" }
    ]
  }
];
