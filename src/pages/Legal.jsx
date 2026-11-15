import { Link, NavLink } from "react-router-dom";
import { ROOT, SUPPORT_EMAIL, hostSlug } from "../api";
import { Icon } from "../ui";
import MainHeader, { MainFooter } from "./MainHeader";

// Bump this date whenever you change any legal text. It is saved with every sign-up as proof of which version the person accepted
// (the backend keeps its own copy in backend/legal.js - keep both the same).
export const TERMS_VERSION = "2026-11-08.2";
export const LEGAL_UPDATED = "8 November 2026";
const MAIL = SUPPORT_EMAIL;

// A section is [title, ...blocks]. A block is a string (paragraph) or an array of strings (bullet list).
const TERMS = [
  ["Acceptance of these Terms",
    `These Terms of Use ("Terms") are a legally binding agreement between you and Orderistan ("Orderistan", "we", "us", "our"), operated from Karachi, Pakistan. They apply to the website ${ROOT}, every seller store on a subdomain of ${ROOT} (for example yourname.${ROOT}), and all related pages, dashboards, chat and notification features (together, the "Platform").`,
    `By creating an account, placing an order, uploading a payment screenshot, opening a store, or simply browsing the Platform, you confirm that you have read, understood and agree to be bound by these Terms, the Privacy Policy and, if you are a seller, the Seller Agreement. If you do not agree, do not use the Platform.`],
  ["Definitions", [
    `"Customer" means anyone who browses or buys through the Platform.`,
    `"Seller" means anyone who opens a store on the Platform.`,
    `"User" means a Customer, a Seller or any other visitor.`,
    `"Transaction" means any order, booking, payment, delivery or other dealing between a Customer and a Seller.`,
    `"Content" means text, images, product listings, reviews, messages, payment screenshots and any other material uploaded to the Platform.`]],
  ["What Orderistan is, and what it is not",
    `Orderistan is a technology platform that gives independent Sellers the tools to run an online store and lets Customers browse and order from them. Orderistan is an intermediary only.`,
    ["Orderistan is NOT the seller, supplier, manufacturer, carrier, agent, guarantor or insurer of any product or service listed on the Platform.",
      "Every sale is a contract directly between the Customer and the Seller. Orderistan is not a party to that contract.",
      "Orderistan has no payment gateway. We do not receive, hold, transfer, escrow, refund or guarantee any money paid for an order.",
      "Orderistan does not inspect, test, authenticate or approve products, services, prices, stock, Sellers or Customers before or after they appear on the Platform.",
      "Store names, logos, photos and descriptions are provided by Sellers. Their appearance on the Platform is not an endorsement by Orderistan."]],
  ["Accounts and eligibility", [
    "You must be at least 18 years old, or use the Platform under the supervision of a parent or legal guardian who accepts these Terms on your behalf.",
    "You must provide accurate, current and complete information (name, email, phone number, address) and keep it up to date.",
    "You are responsible for keeping your password and email access secure. Everything done through your account is treated as done by you.",
    "You must tell us immediately at the contact address below if you suspect unauthorised use of your account.",
    "One person may not hold multiple accounts to evade a suspension, a limit or a decision of Orderistan.",
    "We may refuse registration, or suspend or close any account, at our reasonable discretion."]],
  ["Orders and payments (Customers)",
    ["Payment is made directly to the Seller by bank transfer, JazzCash, Easypaisa or cash on delivery. Orderistan never receives your money.",
      "You must check the Seller's account title, number and details carefully before sending money. Orderistan is not responsible for money sent to a wrong, mistyped, closed, frozen or fraudulent account.",
      "An order is confirmed only when the Seller verifies your payment or accepts a cash-on-delivery order. Verification is performed by the Seller, not by Orderistan.",
      "You must upload only genuine payment proof of a payment you actually made. Uploading a false, edited, reused or fabricated screenshot is fraud and may be reported to the authorities.",
      "Prices, delivery fees, stock and availability are set by the Seller and may change. Mistakes in a listing may be corrected by the Seller.",
      "Before paying, we strongly recommend that you read the Seller's policies, check reviews, confirm details with the Seller on WhatsApp, and avoid paying large amounts to a Seller you do not know."]],
  ["Delivery, returns, refunds and complaints",
    `Delivery, packaging, returns, exchanges, warranties, refunds and after-sales service are the sole responsibility of the Seller and are governed by that Seller's own policy and by applicable law. Orderistan does not deliver goods, does not process refunds and cannot force a Seller to refund or replace an item.`,
    `If you have a problem, contact the Seller first using the order page or WhatsApp, with your order number and photos or proof. You may also tell us through the contact page. We may, at our sole discretion and without any obligation, try to help the parties communicate, but we are not an arbitrator or insurer and our help is not a guarantee of any outcome.`],
  ["Fraud, scams and prohibited conduct",
    `The Platform may only be used for lawful purposes. You must not, and must not help anyone else to:`,
    ["sell or offer fake, counterfeit, stolen, unsafe, illegal or misdescribed goods or services;",
      "accept payment and fail to deliver, or deliver something materially different from what was advertised;",
      "place orders with no intention of paying or receiving the goods, or submit false, edited, duplicate or stolen payment screenshots;",
      "impersonate another person, business or brand, or create fake stores, fake reviews or fake accounts;",
      "use the Platform for phishing, money-laundering, pyramid or Ponzi schemes, fake investment or lottery offers, or any other deception;",
      "collect, harvest or misuse other users' personal data, or send spam or unsolicited promotions;",
      "upload malware, scrape the Platform, probe or attack its security, overload it, or bypass any limit or access control;",
      "post content that is unlawful, abusive, threatening, defamatory, obscene, hateful, or that violates anyone's rights;",
      "use the Platform in breach of any law of Pakistan, including the Prevention of Electronic Crimes Act 2016, or of any rule of a bank or mobile-wallet provider."]],
  ["Orderistan is not responsible for fraud or disputes between Users",
    `To the fullest extent permitted by law, Orderistan is not responsible or liable for any fraud, scam, misrepresentation, non-delivery, late delivery, defective, damaged or counterfeit goods, fake or altered payment proof, wrongly sent money, chargeback, bank or wallet freeze, loss of funds, or any other dishonest, negligent or unlawful act or omission of any Seller, Customer or third party, whether it happens on the Platform, through WhatsApp or any other channel, or off the Platform.`,
    `Each User deals with other Users at their own risk and is solely responsible for taking reasonable precautions. Any claim for loss caused by another User must be made against that User, not against Orderistan. You agree to release Orderistan, its owners, directors, employees, contractors and affiliates from every claim, demand and damage arising from a dispute with another User.`],
  ["Our rights to protect the Platform and its Users",
    `We may, at any time and without prior notice or liability, where we reasonably believe it is necessary to protect Users, the Platform, ourselves or the law:`,
    ["investigate any suspected fraud, abuse or breach of these Terms;",
      "remove or hide any store, product, review, message or other Content;",
      "restrict, suspend or permanently terminate any account or store, and block an email address, phone number, device or IP address;",
      "pause or refuse any order, booking or subscription;",
      "preserve records, logs, messages, payment screenshots and other evidence;",
      "report suspected crimes and share relevant User information and evidence with the Federal Investigation Agency (FIA), police, courts, banks, mobile-wallet providers, regulators and other lawful authorities, and with a person who proves a legal right to it;",
      "take any other step we consider reasonable to stop or limit harm."],
    `Nothing in these Terms obliges us to monitor the Platform or to take any of these steps, and failing to act in one case does not waive our right to act in another.`],
  ["User content",
    `You keep ownership of the Content you upload. By uploading it you grant Orderistan a worldwide, non-exclusive, royalty-free, transferable licence to host, store, display, reproduce, resize, adapt and distribute it for the purpose of operating, securing, promoting and improving the Platform. You promise that you have the right to upload it, that it is accurate and lawful, and that it does not infringe anyone's rights. You are responsible for all Content you post. We may remove Content at any time.`],
  ["Intellectual property",
    `The Orderistan name, logo, design, software, text and all other Platform materials (other than Users' Content) belong to Orderistan or its licensors and are protected by law. You may not copy, modify, resell, reverse-engineer or exploit them without our written permission. Sellers are solely responsible for ensuring they have the rights to every product, photo, brand name and description they list.`],
  ["Use of your data",
    `We collect and use personal data as explained in our Privacy Policy. By using the Platform you agree that we may use your information, including account details, activity, orders, device and usage data, to run and secure the Platform, to detect and prevent fraud and abuse, to analyse how the Platform is used, and to fix, test and improve the Platform, its features and its services. Where we do this for analysis and improvement we use aggregated or de-identified data wherever reasonably possible.`],
  ["Third-party services and links",
    `The Platform relies on third-party services such as hosting, image storage, email delivery, banks, mobile wallets and messaging apps (including WhatsApp). Links and integrations to third parties are provided for convenience. We do not control them and are not responsible for their content, availability, security or privacy practices, or for any loss you suffer through them.`],
  ["Disclaimer of warranties",
    `The Platform is provided "as is" and "as available". To the fullest extent permitted by law, Orderistan makes no warranty or representation of any kind, express or implied, including about merchantability, fitness for a particular purpose, accuracy, reliability, security, non-infringement, uninterrupted or error-free operation, or the quality, safety, legality or authenticity of any product, service, Seller or Customer. We do not warrant that the Platform will be free of errors, bugs, viruses or downtime, or that data will never be lost.`],
  ["Limitation of liability",
    ["To the fullest extent permitted by law, Orderistan and its owners, directors, employees, contractors and affiliates are not liable for any indirect, incidental, special, consequential, exemplary or punitive damages, or for any loss of profit, revenue, sales, business, goodwill, data or opportunity, arising out of or connected with the Platform or these Terms, even if we were told such loss was possible.",
      "Without limiting the above, we are not liable for any loss caused by fraud or misconduct of any User or third party, by failed, delayed, wrong or reversed payments, by unauthorised access to your account that was not caused by our own gross negligence, by downtime, by changes to third-party services, or by events beyond our reasonable control.",
      "Where liability cannot be excluded by law, our total aggregate liability to you for all claims is limited to the greater of (a) the amount you paid to Orderistan in the three months before the event, or (b) PKR 5,000. Customers pay Sellers, not Orderistan, so for order-related claims this amount may be zero.",
      "Nothing in these Terms excludes liability that cannot lawfully be excluded."]],
  ["Indemnity",
    `You agree to defend, indemnify and hold harmless Orderistan, its owners, directors, employees, contractors and affiliates from and against all claims, losses, damages, penalties, fines, costs and expenses (including reasonable legal fees) arising out of or related to: your use of the Platform; your Content; your breach of these Terms or any law; any fraud, misrepresentation or dishonest act by you; your dealings with any other User; or your infringement of any third party's rights.`],
  ["Suspension and termination",
    `You may stop using the Platform and ask us to close your account at any time. We may suspend or terminate your access at any time for any breach of these Terms, suspected fraud or illegal activity, risk to other Users or the Platform, non-payment of subscription (Sellers), or if we decide to stop offering the service. Sections that by their nature should survive termination (including fraud and liability provisions, data use, intellectual property, indemnity, limitation of liability and governing law) will survive. Closing an account does not cancel any order already confirmed or any amount already owed.`],
  ["Force majeure",
    `We are not liable for any failure or delay caused by events beyond our reasonable control, including natural disaster, war, civil unrest, strikes, government action, power or internet failure, cyber-attack, failure of banks, wallets, hosting or other third-party providers, or changes in law.`],
  ["Governing law and dispute resolution", [
    "These Terms are governed by the laws of the Islamic Republic of Pakistan.",
    "If a dispute arises between you and Orderistan, you agree to first contact us and try in good faith to settle it informally for at least 30 days.",
    "If it is not settled, the dispute will be referred to arbitration in Karachi under the Arbitration Act 1940 (or any law that replaces it) before a single arbitrator, in English or Urdu. Either side may instead bring urgent injunctive claims or claims that cannot be arbitrated before the courts.",
    "Subject to the above, the courts of Karachi, Sindh have exclusive jurisdiction.",
    "To the extent the law allows, each party may bring claims only in its individual capacity and not as part of a class or representative action."]],
  ["Changes to these Terms",
    `We may update these Terms from time to time. The date at the top shows the latest version. If a change is material we will give notice on the Platform or by email. By continuing to use the Platform after a change takes effect you accept the updated Terms. If you do not accept them you must stop using the Platform.`],
  ["General", [
    "Entire agreement: these Terms, the Privacy Policy and (for Sellers) the Seller Agreement are the whole agreement between you and Orderistan about the Platform.",
    "Severability: if any part is found unenforceable, the rest stays in force and the part is replaced by the closest enforceable wording.",
    "No waiver: a delay or failure to enforce a right is not a waiver of it.",
    "Assignment: you may not transfer your rights under these Terms; we may transfer ours in connection with a merger, sale or reorganisation.",
    "Electronic records: you agree that electronic acceptance of these Terms, our logs and records of your acceptance are valid and admissible, consistent with the Electronic Transactions Ordinance 2002.",
    "Language: if translated, the English version prevails.",
    "Relationship: nothing here makes you an employee, partner, agent or joint venturer of Orderistan."]],
  ["Contact",
    `Questions, legal notices, fraud reports and data requests: email ${MAIL} or use the contact page. Please include your name, account email and, for a fraud report, the order number, store name, amounts and screenshots or other proof.`]
];

const COOKIES = [
  ["What are cookies",
    `Cookies are small text files that a website stores in your browser. We also use similar technologies such as your browser's local storage. They let a website recognise your device, keep you signed in, remember choices and understand how the website is used. In this policy "cookies" means all of them.`],
  ["How we use them and how you stay in control", [
    "When you first visit Orderistan (or a seller store on a subdomain of " + ROOT + ") a banner asks for your choice. Nothing optional is switched on before you agree.",
    "You can accept all, reject all non-essential cookies, or customise each category.",
    "You can change or withdraw your choice at any time with Cookie settings (the link at the bottom of every page, or the small cookie button on desktop). Withdrawing is as easy as giving consent.",
    "A choice made on the main site also applies to every seller store on " + ROOT + ".",
    "We ask again after 12 months, or sooner if we add new kinds of cookies."]],
  ["Categories of cookies", [
    "Strictly necessary: required for the Platform to work (sign-in, cart, saved addresses, remembering your cookie choice). They are always on and do not need consent.",
    "Preferences: remember settings such as light or dark mode.",
    "Analytics and performance: help us understand how the Platform is used, find errors and make it faster and easier to use.",
    "Marketing and personalization: personalise content and offers and measure how well they work."]],
  ["Cookies and storage items we use",
    { table: [
      ["Name", "Type", "Category", "Purpose", "How long"],
      ["orderistan_consent", "Cookie (first-party)", "Strictly necessary", "Remembers your cookie choices.", "12 months"],
      ["orderistan_token", "Local storage", "Strictly necessary", "Keeps you signed in to your account.", "Until you log out or the session expires"],
      ["cart:<store>", "Local storage", "Strictly necessary", "Keeps the items in your cart for each store.", "Until you clear it or empty the cart"],
      ["orderistan_addr:<user>", "Local storage", "Strictly necessary", "Keeps delivery addresses you chose to save, on your device only.", "Until you delete them"],
      ["orderistan_mode", "Local storage", "Preferences", "Remembers light or dark mode.", "Until you clear it or withdraw consent"]
    ] },
    `This table lists what the Platform sets today. Where an optional category has no entry, we are not using it at the moment.`],
  ["Analytics and marketing tools",
    `Analytics and marketing tools, if we start using them, load only after you allow the matching category, and we will add them to the table above. If you withdraw consent, the tool stops loading on your next page load. We do not sell your personal data.`],
  ["Third parties",
    `Some content comes from other services, for example product images served by our image provider, and links that open WhatsApp. Those services have their own privacy and cookie practices that we do not control. Payments are made directly to sellers by bank or wallet transfer, so no payment-provider cookies are set by us.`],
  ["Browser settings and privacy signals",
    `You can also block or delete cookies in your browser. If you do, parts of the Platform (sign-in and cart) may stop working. If your browser sends a Global Privacy Control signal, optional categories stay off until you choose to switch them on.`],
  ["Records of your choice",
    `To prove that consent was given or refused, we store a random ID, your choices, the version of this policy, the date and time, your IP address and your browser details for up to three years.`],
  ["Changes and contact",
    `We may update this policy when we change how we use cookies. The date above shows the latest version. Questions: ${MAIL}.`]
];

const SELLER = [
  ["Scope and acceptance",
    `This Seller Agreement ("Agreement") applies to every person or business that opens or operates a store on ${ROOT} ("Seller", "you"). It is in addition to the Terms of Use and the Privacy Policy. By opening a store, you confirm that you accept all three documents. If you accept on behalf of a business, you confirm that you have authority to bind it.`],
  ["Eligibility and verification", [
    "You must be at least 18, legally able to run a business, and able to lawfully sell what you list.",
    "All information you give (name, phone, CNIC or business details if requested, address, store name, bank and wallet details) must be true and current.",
    "We may ask for identity, business or ownership proof at any time and may suspend a store until it is provided.",
    "You may not open stores to evade a suspension or ban."]],
  ["Subscription, activation and fees", [
    "Stores run on a subscription. Your store goes live only after Orderistan activates it, and stays live only while the subscription is active.",
    "Plans, prices, duration and any trial are shown on the Platform or communicated by Orderistan and may change for future periods.",
    "Subscription fees are charged for access to the software and hosting. Unless Orderistan agrees otherwise in writing, fees already paid are non-refundable, including if you stop using the store or your store is suspended or closed for breach.",
    "When a subscription expires or is deactivated, your store may go offline. Orderistan may delete store data after a reasonable period following expiry or termination.",
    "You are responsible for any taxes that apply to your business and sales."]],
  ["You are an independent merchant",
    `You sell in your own name and at your own risk. You are not an employee, agent, partner or representative of Orderistan. You alone are responsible for your products and services, their quality, safety, legality and authenticity, your prices, stock, descriptions and photos, packaging, delivery, returns, refunds, warranties, customer service, licences, and all taxes and duties (including income tax and sales tax obligations with the FBR and provincial authorities where applicable).`],
  ["Payments are between you and your customers", [
    "Orderistan has no payment gateway and never holds customer money. Customers pay you directly into the bank account, JazzCash or Easypaisa number you enter, or by cash on delivery.",
    "You must enter only accounts that you own or are lawfully authorised to use, and keep the details accurate. You must not direct customers to accounts of third parties.",
    "You must verify each payment inside your own bank or wallet before confirming an order or sending goods. A screenshot is not proof of payment on its own; screenshots can be edited or fake.",
    "Orderistan does not verify, guarantee or reverse any payment. You accept all risk of fake or altered screenshots, wrong or reversed transfers, wallet or bank holds, cash-on-delivery refusals and non-payment.",
    "You are responsible for refunds to customers when you are required to give them, and for sending them promptly to the correct account."]],
  ["Fraud and honest dealing",
    `You must deal honestly and fairly with customers. You must not:`,
    ["accept payment and fail to deliver, or knowingly deliver something different from what you listed;",
      "list fake, counterfeit, replica sold as original, stolen, expired or unsafe goods;",
      "use misleading prices, fake discounts, fake stock, fake reviews, or bait-and-switch tactics;",
      "ask customers for payments outside the agreed order flow, for passwords, OTP codes or card details, or for advance fees for things not listed;",
      "pressure, threaten or harass customers, or misuse their personal data;",
      "manipulate ratings or reviews of your own store or competitors."],
    `If you commit or are reasonably suspected of fraud, Orderistan may immediately suspend or close your store without refund, hide your listings, keep evidence, and report you and share your registration, contact, bank or wallet details, orders, messages and logs with the FIA, police, courts, banks, wallet providers or an affected customer. You will be solely liable to affected customers and any authority.`],
  ["Prohibited items and services",
    `You must not list or sell anything that is illegal in Pakistan or that breaches the rules of any bank or wallet provider, including:`,
    ["narcotics, intoxicants, and controlled or prescription medicines without proper licence;",
      "weapons, ammunition, explosives and related items;",
      "counterfeit, pirated or stolen goods and items that infringe intellectual property;",
      "adult, obscene or exploitative material;",
      "human organs, endangered wildlife or products, and anything involving human trafficking;",
      "gambling, lottery, pyramid or investment schemes and unlicensed financial services;",
      "personal data, hacked accounts or services intended to defraud;",
      "anything else that Orderistan reasonably decides is harmful, unlawful or damages the Platform's reputation."],
    `Orderistan may remove any listing without notice. Food Sellers must hold and follow all food-safety licences and standards that apply to them. Service Sellers must hold any required professional licences.`],
  ["Customer data and privacy",
    ["You will receive customers' names, phone numbers, addresses, order details and payment screenshots only to fulfil their orders and give support.",
      "You must keep this data confidential and secure, use it for no other purpose, never sell, share, publish or leak it, and not send marketing messages to customers who have not agreed to receive them.",
      "You must follow all privacy and data-protection laws that apply to you, and delete customer data when you no longer need it for the order, for your legal duties or to handle a dispute.",
      "You are responsible for any misuse of customer data by you or anyone you give access to."]],
  ["Your content and your store",
    `You grant Orderistan the licence set out in the Terms of Use for all Content you upload. You promise you own or have the right to use all of it. You must keep your store details, policies, delivery fees, payment details and contact details accurate. You are responsible for everyone you allow to access your store account.`],
  ["Orderistan's rights over your store",
    `Orderistan may at any time, with or without notice, modify, suspend, hide, restrict or close a store, remove Content, delay activation, change features, or limit access, to protect customers, the Platform or the law, if you breach any of our documents, if payment is overdue, if we receive credible complaints, or if required by law or an authority. Orderistan is not liable to you for lost sales, profit or goodwill resulting from any such action taken in good faith.`],
  ["No liability, indemnity and limits",
    ["Orderistan is not liable for any loss you suffer from customers' fraud, fake payment proof, chargebacks, non-payment, returns, cancelled orders, bad reviews, downtime, lost data, third-party service failures, or from any decision of a bank, wallet provider or authority.",
      "You agree to defend, indemnify and hold Orderistan, its owners, directors, employees and contractors harmless from any claim, loss, penalty, fine, cost or expense (including legal fees) arising from your products, services, Content, sales, taxes, data handling, fraud, breach of this Agreement or of any law, or any dispute with a customer or third party.",
      "The disclaimers and limits of liability in the Terms of Use apply fully to this Agreement. Our total liability to you is limited to the subscription fees you actually paid to Orderistan in the three months before the claim."]],
  ["Termination and after termination",
    `You may close your store at any time by contacting us, but fees already paid are not refundable unless agreed in writing. We may terminate as described above. You remain responsible for confirmed orders and for refunds, claims and obligations that arose before termination. Orderistan may keep records and evidence for as long as needed for legal, security, accounting and dispute purposes, and may release your store link for others after a reasonable period.`],
  ["Governing law and changes",
    `This Agreement is governed by the laws of Pakistan and the dispute-resolution and jurisdiction terms (Karachi) in the Terms of Use apply. We may update this Agreement by posting the new version or notifying you; continuing to operate your store after the change means you accept it. Contact: ${MAIL}.`]
];

const PRIVACY = [
  ["Who we are",
    `Orderistan, based in Karachi, Pakistan, operates ${ROOT} and Seller stores on its subdomains. This Privacy Policy explains what personal information we collect, why, how we use it (including to improve the Platform), who we share it with, and the choices you have. By using the Platform and accepting our Terms, you agree to this Policy.`],
  ["Information we collect", [
    "Account information: name, email address, phone / WhatsApp number, password (stored only in hashed form), profile picture, and role (customer, seller or admin).",
    "Order information: items, amounts, delivery name, address, phone, notes, order status history, bookings, reviews, wishlist and saved addresses.",
    "Payment information you upload: screenshots of transfers and the payment method you chose. We do not collect card numbers and we do not process payments.",
    "Seller information: store name, link, category, logo, banner, products, policies, business contact details and the bank / wallet details you publish for customers to pay you; subscription and plan details.",
    "Messages: chat messages and attachments between customers, sellers and the Orderistan team, and notifications sent to you.",
    "Technical and usage information: IP address, browser and device type, pages and features used, dates and times, login and security events, error logs, and the store you came from.",
    "Information you send us: support requests, fraud reports, and anything you tell us in the contact form or by email."]],
  ["How we use your information", [
    "To create and run your account, process sign-up verification codes, and log you in securely.",
    "To let customers order and Sellers receive, verify, fulfil and manage orders, bookings and payments.",
    "To send service messages, such as OTP codes, order and payment updates, subscription and renewal notices, and security alerts.",
    "To detect, investigate and prevent fraud, abuse, fake accounts, fake screenshots and security threats, and to enforce our Terms.",
    "To give support and resolve complaints and disputes.",
    "To improve the Platform: to understand how people use it, measure performance, find and fix bugs, test and develop new features, improve design, search, recommendations and usability, and plan the service (see the next section).",
    "To meet legal, tax, accounting and regulatory duties and to respond to lawful requests from authorities.",
    "For any other purpose you agree to."]],
  ["Using data to improve the website",
    `You agree that Orderistan may analyse activity and usage on the Platform, including pages visited, searches, clicks, orders, device and error information, and the Content and messages needed to investigate abuse, in order to improve the Platform's features, speed, reliability, security and user experience. Where reasonably possible we use aggregated, anonymised or de-identified information for this purpose. We may also publish or share aggregated statistics that do not identify you. We do not sell your personal information. You can ask us to stop non-essential analysis of your personal data by contacting us, but some data processing is necessary to run and secure the service.`],
  ["Who we share information with", [
    "Sellers: when you order from a store, that Seller receives your name, phone, address, order details, notes and payment screenshot, and can message you. Sellers must keep this confidential and use it only for your order.",
    "Customers: when you are a Seller, customers see your store information, products, reviews, and the payment details you chose to show them.",
    "Service providers who help us run the Platform, such as hosting and database providers, image storage and delivery (Cloudinary), and email delivery (Brevo). They may process data only on our behalf and for our purposes.",
    "Authorities and other parties: the FIA, police, courts, regulators, banks and wallet providers when we believe in good faith that disclosure is required by law or needed to investigate or prevent fraud, crime, abuse or harm, to enforce our Terms, or to protect rights, safety and property.",
    "Business changes: a buyer or successor if Orderistan is merged, sold or reorganised, with the same protection for your data.",
    "With your consent or at your request."]],
  ["Payment screenshots and chat",
    `Payment screenshots are visible to you, the Seller you paid and authorised Orderistan staff for verification, support and fraud prevention. Do not include unnecessary personal information (such as full card numbers or CNIC) in screenshots or chats. Chat messages are stored so that parties and, where needed, Orderistan administrators can resolve disputes and investigate abuse.`],
  ["Cookies and local storage",
    `We store a sign-in token and your cart in your browser's local storage so you stay signed in and keep your cart. Saved addresses stay on your device. We and our providers may also use logs and similar technology to keep the Platform secure and to measure how it is used. You can clear this data in your browser, but parts of the Platform may then not work.`],
  ["Security",
    `We use reasonable technical and organisational measures, such as hashed passwords, access controls, rate limits, email verification codes and encrypted connections. No system is perfectly secure and we cannot guarantee absolute security. You are responsible for keeping your password and email secure. Tell us immediately if you think your account has been compromised.`],
  ["How long we keep information",
    `We keep personal information for as long as your account is active and as needed to provide the service, resolve disputes, prevent fraud, enforce our Terms, keep records, and meet legal obligations. We then delete or anonymise it. Some records (orders, logs, evidence of fraud or abuse) may be kept after account closure.`],
  ["Your choices and rights", [
    "You can view and update your details from your profile.",
    "You can ask us to correct your information, delete your account or personal data, or give you a copy of what we hold, by contacting us. We may need to verify who you are, and may keep information we are required or permitted to keep (for example for fraud prevention, disputes, accounting or legal reasons).",
    "You can withdraw consent to optional processing; this does not affect past processing and may limit what the Platform can do for you.",
    "You can unsubscribe from non-essential messages. Service and security messages will still be sent."]],
  ["Children",
    `The Platform is not intended for anyone under 18 to use on their own. If you believe a child has given us personal information without parental consent, contact us and we will delete it.`],
  ["Where information is stored",
    `Our service providers may store and process information on servers in Pakistan or in other countries. By using the Platform you agree to this transfer. We take reasonable steps so that your information stays protected.`],
  ["Changes to this policy",
    `We may update this Policy from time to time. The date at the top shows the latest version. If a change is material we will notify you. Continuing to use the Platform after the change means you accept it.`],
  ["Contact us",
    `For privacy questions or requests, email ${MAIL} or use the contact page.`]
];

function Frame({ title, icon, children }) {
  return (
    <div className="landing">
      <MainHeader />
      <section className="info-hero"><div className="container"><span className="info-ico"><Icon n={icon} /></span><h1>{title}</h1><p>Last updated {LEGAL_UPDATED} &middot; Version {TERMS_VERSION}</p></div></section>
      <div className="container info-body narrow">{children}</div>
      <MainFooter />
    </div>
  );
}

const Block = ({ b }) => Array.isArray(b) ? <ul>{b.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p>{b}</p>;

function LegalDoc({ title, icon, intro, sections }) {
  return (
    <Frame title={title} icon={icon}>
      <nav className="legal-tabs" aria-label="Legal documents">
        <NavLink to="/terms">Terms of Use</NavLink><NavLink to="/seller-terms">Seller Agreement</NavLink><NavLink to="/privacy">Privacy Policy</NavLink><NavLink to="/cookies">Cookie Policy</NavLink>
      </nav>
      {intro && <div className="legal-intro"><Icon n="shield" /><p>{intro}</p></div>}
      <div className="card legal-toc"><h3>Contents</h3><ol>{sections.map(([t], i) => <li key={t}><a href={"#sec-" + (i + 1)}>{t}</a></li>)}</ol></div>
      <div className="card doc legal-doc">
        {sections.map(([t, ...blocks], i) => (
          <section key={t} id={"sec-" + (i + 1)} className="legal-sec">
            <h3><span>{i + 1}.</span> {t}</h3>
            {blocks.map((b, k) => <Block key={k} b={b} />)}
          </section>
        ))}
      </div>
      <p className="muted center" style={{ marginTop: 18 }}>Questions? <Link to="/contact">Contact us</Link> &middot; <a href={"mailto:" + MAIL}>{MAIL}</a></p>
    </Frame>
  );
}

export const Terms = () => <LegalDoc title="Terms of Use" icon="file" sections={TERMS}
  intro="Please read carefully. Orderistan is a platform only: payments and deliveries are between customers and sellers, and Orderistan is not responsible for fraud or disputes between users." />;
export const SellerTerms = () => <LegalDoc title="Seller Agreement" icon="store" sections={SELLER}
  intro="This agreement applies to every seller. You are an independent merchant and are fully responsible for your products, payments, deliveries, taxes and customers." />;
export const Privacy = () => <LegalDoc title="Privacy Policy" icon="lock" sections={PRIVACY}
  intro="This policy explains what data we collect and how we use it, including to protect users from fraud and to improve the website." />;
export const CookiePolicy = () => <LegalDoc title="Cookie Policy" icon="lock" sections={COOKIES}
  intro="Optional cookies are off until you say yes. You can change your choice at any time with Cookie settings at the bottom of the page." />;

// Checkbox shown on every sign-up form. The form cannot be submitted until it is ticked (the server checks again).
export function TermsConsent({ checked, onChange, seller }) {
  const ext = { target: "_blank", rel: "noreferrer" }; const b = hostSlug() ? `https://${ROOT}` : ""; // store subdomains do not have these pages
  return (
    <label className="consent">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
      <span>I am 18 or older and I have read and agree to the <a href={b + "/terms"} {...ext}>Terms of Use</a>{seller && <>, the <a href={b + "/seller-terms"} {...ext}>Seller Agreement</a></>} and the <a href={b + "/privacy"} {...ext}>Privacy Policy</a>. I understand that Orderistan is not responsible for fraud or disputes between users, and I agree that my data may be used to run, secure and improve the website.</span>
    </label>
  );
}

// Short reminder shown at checkout next to the payment details.
export const PayWarning = () => (
  <p className="pay-warn"><Icon n="shield" /> <span>Pay only the account shown for this store and check the account title first. Payments go directly to the seller, so Orderistan cannot refund or recover money. See the <a href={`https://${ROOT}/terms`} target="_blank" rel="noreferrer">Terms</a>.</span></p>
);
