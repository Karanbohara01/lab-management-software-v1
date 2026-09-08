/**
 * Nepal administrative geography — 7 provinces and their 77 districts.
 *
 * Local level (municipality / rural municipality) is captured as free text for
 * now; a full 753-entry dataset can be dropped in here later without touching
 * the registration UI.
 */
export interface Province {
  name: string;
  districts: string[];
}

export const PROVINCES: Province[] = [
  {
    name: 'Koshi',
    districts: [
      'Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga',
      'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur',
    ],
  },
  {
    name: 'Madhesh',
    districts: ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  },
  {
    name: 'Bagmati',
    districts: [
      'Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur',
      'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok',
    ],
  },
  {
    name: 'Gandaki',
    districts: [
      'Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi',
      'Nawalpur', 'Parbat', 'Syangja', 'Tanahun',
    ],
  },
  {
    name: 'Lumbini',
    districts: [
      'Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Eastern Rukum', 'Gulmi', 'Kapilvastu',
      'Nawalparasi (West)', 'Palpa', 'Pyuthan', 'Rolpa', 'Rupandehi',
    ],
  },
  {
    name: 'Karnali',
    districts: [
      'Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu',
      'Salyan', 'Surkhet', 'Western Rukum',
    ],
  },
  {
    name: 'Sudurpashchim',
    districts: [
      'Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti',
      'Kailali', 'Kanchanpur',
    ],
  },
];

export const PROVINCE_NAMES = PROVINCES.map((p) => p.name);

export function districtsOf(province: string | null | undefined): string[] {
  return PROVINCES.find((p) => p.name === province)?.districts ?? [];
}

/** Highest ward count of any Nepali local level is 33 (a handful of metros). */
export const MAX_WARDS = 33;
export const WARD_OPTIONS = Array.from({ length: MAX_WARDS }, (_, i) => String(i + 1));

/**
 * Local levels (municipalities / rural municipalities) by district.
 *
 * Covers the districts a diagnostic lab most commonly serves. Where a district
 * is not listed, or a local level is missing, the picker falls back to free
 * text — so this can be extended toward the full 753 without any UI change.
 */
export const MUNICIPALITIES: Record<string, string[]> = {
  // ---- Bagmati ----
  Kathmandu: [
    'Kathmandu Metropolitan City', 'Budhanilkantha', 'Chandragiri', 'Gokarneshwar', 'Kageshwari-Manohara',
    'Kirtipur', 'Nagarjun', 'Tarakeshwar', 'Tokha', 'Dakshinkali', 'Shankharapur',
  ],
  Lalitpur: ['Lalitpur Metropolitan City', 'Godawari', 'Mahalaxmi', 'Konjyosom', 'Bagmati', 'Mahankal'],
  Bhaktapur: ['Bhaktapur', 'Madhyapur Thimi', 'Changunarayan', 'Suryabinayak'],
  Chitwan: ['Bharatpur Metropolitan City', 'Ratnanagar', 'Khairahani', 'Madi', 'Rapti', 'Kalika', 'Ichchhakamana'],
  Makwanpur: ['Hetauda Sub-Metropolitan City', 'Thaha', 'Bhimphedi', 'Makawanpurgadhi', 'Manahari', 'Raksirang', 'Bakaiya', 'Bagmati', 'Kailash', 'Indrasarowar'],
  Dhading: ['Nilkantha', 'Dhunibeshi', 'Gajuri', 'Galchhi', 'Thakre', 'Jwalamukhi', 'Siddhalek', 'Benighat Rorang', 'Gangajamuna', 'Netrawati Dabjong', 'Khaniyabas', 'Rubi Valley', 'Tripura Sundari'],
  Kavrepalanchok: ['Dhulikhel', 'Banepa', 'Panauti', 'Panchkhal', 'Namobuddha', 'Mandandeupur', 'Khanikhola', 'Chaurideurali', 'Temal', 'Bethanchok', 'Bhumlu', 'Mahabharat', 'Roshi'],
  Sindhupalchok: ['Chautara Sangachokgadhi', 'Bahrabise', 'Melamchi', 'Balephi', 'Sunkoshi', 'Indrawati', 'Jugal', 'Panchpokhari Thangpal', 'Bhotekoshi', 'Lisankhu Pakhar', 'Helambu', 'Tripurasundari'],
  Nuwakot: ['Bidur', 'Belkotgadhi', 'Kakani', 'Kispang', 'Myagang', 'Panchakanya', 'Shivapuri', 'Suryagadhi', 'Tadi', 'Tarkeshwar', 'Dupcheshwar', 'Likhu'],
  Sindhuli: ['Kamalamai', 'Dudhouli', 'Golanjor', 'Ghyanglekh', 'Hariharpurgadhi', 'Marin', 'Phikkal', 'Sunkoshi', 'Tinpatan'],
  Ramechhap: ['Manthali', 'Ramechhap', 'Umakunda', 'Khadadevi', 'Doramba', 'Gokulganga', 'Likhu Tamakoshi', 'Sunapati'],
  Dolakha: ['Bhimeshwar', 'Jiri', 'Kalinchok', 'Melung', 'Bigu', 'Gaurishankar', 'Baiteshwar', 'Sailung', 'Tamakoshi'],
  Rasuwa: ['Uttargaya', 'Kalika', 'Gosaikunda', 'Naukunda', 'Aamachhodingmo'],

  // ---- Gandaki ----
  Kaski: ['Pokhara Metropolitan City', 'Annapurna', 'Machhapuchhre', 'Madi', 'Rupa'],
  Tanahun: ['Bhanu', 'Bhimad', 'Byas', 'Shuklagandaki', 'Anbukhaireni', 'Devghat', 'Bandipur', 'Ghiring', 'Myagde', 'Rhishing'],
  Syangja: ['Putalibazar', 'Bhirkot', 'Chapakot', 'Galyang', 'Waling', 'Aandhikhola', 'Arjunchaupari', 'Biruwa', 'Harinas', 'Kaligandaki', 'Phedikhola'],
  Gorkha: ['Gorkha', 'Palungtar', 'Sulikot', 'Siranchok', 'Ajirkot', 'Aarughat', 'Bhimsen Thapa', 'Chum Nubri', 'Dharche', 'Gandaki', 'Barpak Sulikot'],
  Lamjung: ['Besisahar', 'Sundarbazar', 'Rainas', 'Madhya Nepal', 'Kwholasothar', 'Dordi', 'Dudhpokhari', 'Marsyangdi'],
  Baglung: ['Baglung', 'Galkot', 'Jaimini', 'Dhorpatan', 'Bareng', 'Kathekhola', 'Taman Khola', 'Tara Khola', 'Nisikhola', 'Badigad'],
  Parbat: ['Kushma', 'Phalewas', 'Jaljala', 'Modi', 'Bihadi', 'Painyu', 'Mahashila'],
  Myagdi: ['Beni', 'Annapurna', 'Dhaulagiri', 'Mangala', 'Malika', 'Raghuganga'],
  Nawalpur: ['Kawasoti', 'Gaindakot', 'Devchuli', 'Madhyabindu', 'Baudikali', 'Bulingtar', 'Binayi Tribeni', 'Hupsekot'],
  Manang: ['Chame', 'Nason', 'Narpa Bhumi', 'Manang Ngisyang'],
  Mustang: ['Gharpajhong', 'Thasang', 'Barhagaun Muktikshetra', 'Lo-Ghekar Damodarkunda', 'Lomanthang'],

  // ---- Koshi ----
  Morang: ['Biratnagar Metropolitan City', 'Sundarharaicha', 'Belbari', 'Pathari-Shanishchare', 'Urlabari', 'Rangeli', 'Letang', 'Ratuwamai', 'Sunwarshi', 'Budhiganga', 'Gramthan', 'Jahada', 'Kanepokhari', 'Katahari', 'Kerabari', 'Miklajung', 'Dhanpalthan'],
  Sunsari: ['Itahari Sub-Metropolitan City', 'Dharan Sub-Metropolitan City', 'Inaruwa', 'Duhabi', 'Ramdhuni', 'Barah', 'Koshi', 'Gadhi', 'Barju', 'Bhokraha Narsingh', 'Harinagar', 'Dewanganj'],
  Jhapa: ['Bhadrapur', 'Damak', 'Mechinagar', 'Birtamod', 'Arjundhara', 'Shivasatakshi', 'Gauradaha', 'Kankai', 'Buddhashanti', 'Haldibari', 'Jhapa', 'Kachankawal', 'Barhadashi', 'Gauriganj', 'Kamal'],
  Dhankuta: ['Dhankuta', 'Pakhribas', 'Mahalaxmi', 'Sangurigadhi', 'Chaubise', 'Shahidbhumi', 'Chhathar Jorpati'],
  Ilam: ['Ilam', 'Deumai', 'Mai', 'Suryodaya', 'Fakphokthum', 'Chulachuli', 'Mangsebung', 'Rong', 'Sandakpur', 'Maijogmai'],
  Udayapur: ['Triyuga', 'Katari', 'Chaudandigadhi', 'Belaka', 'Udayapurgadhi', 'Rautamai', 'Tapli', 'Limchungbung'],
  Bhojpur: ['Bhojpur', 'Shadananda', 'Aamchok', 'Hatuwagadhi', 'Ramprasad Rai', 'Arun', 'Pauwadungma', 'Salpasilichho', 'Tyamkemaiyung'],
  Sankhuwasabha: ['Khandbari', 'Chainpur', 'Dharmadevi', 'Panchkhapan', 'Madi', 'Makalu', 'Silichong', 'Sabhapokhari', 'Chichila', 'Bhotkhola'],
  Taplejung: ['Phungling', 'Aathrai Tribeni', 'Sidingwa', 'Phaktanglung', 'Mikwakhola', 'Meringden', 'Maiwakhola', 'Yangwarak', 'Sirijangha'],
  Terhathum: ['Myanglung', 'Laligurans', 'Aathrai', 'Chhathar', 'Phedap', 'Menchhayayem'],
  Panchthar: ['Phidim', 'Hilihang', 'Kummayak', 'Miklajung', 'Phalelung', 'Phalgunanda', 'Tumbewa', 'Yangwarak'],
  Khotang: ['Diktel Rupakot Majhuwagadhi', 'Halesi Tuwachung', 'Aiselukharka', 'Jantedhunga', 'Kepilasgadhi', 'Barahapokhari', 'Rawa Besi', 'Sakela', 'Diprung Chuichumma', 'Khotehang'],
  Okhaldhunga: ['Siddhicharan', 'Champadevi', 'Chisankhugadhi', 'Khijidemba', 'Likhu', 'Manebhanjyang', 'Molung', 'Sunkoshi'],
  Solukhumbu: ['Solududhkunda', 'Necha Salyan', 'Mahakulung', 'Likhupike', 'Sotang', 'Dudhkoshi', 'Khumbupasanglahmu', 'Thulung Dudhkoshi'],

  // ---- Madhesh ----
  Dhanusha: ['Janakpurdham Sub-Metropolitan City', 'Chhireshwarnath', 'Ganeshman Charnath', 'Dhanusadham', 'Nagarain', 'Bideha', 'Mithila', 'Sabaila', 'Kamala', 'Mithila Bihari', 'Hanspur', 'Janaknandini', 'Laxminiya', 'Mukhiyapatti Musharniya', 'Aurahi', 'Dhanauji', 'Bateshwar'],
  Mahottari: ['Jaleshwar', 'Bardibas', 'Gaushala', 'Loharpatti', 'Ramgopalpur', 'Manara Shiswa', 'Matihani', 'Balawa', 'Aurahi', 'Bhangaha', 'Ekdanra', 'Mahottari', 'Pipara', 'Samsi', 'Sonama'],
  Sarlahi: ['Malangwa', 'Lalbandi', 'Haripur', 'Haripurwa', 'Hariwan', 'Barahathwa', 'Ishworpur', 'Kabilasi', 'Bagmati', 'Balara', 'Godaita', 'Basbariya', 'Bishnu', 'Brahmapuri', 'Chakraghatta', 'Chandranagar', 'Dhankaul', 'Kaudena', 'Parsa', 'Ramnagar'],
  Bara: ['Kalaiya Sub-Metropolitan City', 'Jitpur Simara Sub-Metropolitan City', 'Kolhabi', 'Nijgadh', 'Mahagadhimai', 'Simraungadh', 'Pacharauta', 'Pheta', 'Bishrampur', 'Prasauni', 'Adarsh Kotwal', 'Karaiyamai', 'Devtal', 'Parwanipur', 'Baragadhi', 'Suwarna'],
  Parsa: ['Birgunj Metropolitan City', 'Bahudarmai', 'Parsagadhi', 'Pokhariya', 'Bindabasini', 'Chhipaharmai', 'Dhobini', 'Jagarnathpur', 'Jirabhawani', 'Kalikamai', 'Pakahamainpur', 'Paterwa Sugauli', 'Sakhuwa Prasauni', 'Thori'],
  Rautahat: ['Gaur', 'Chandrapur', 'Garuda', 'Baudhimai', 'Brindaban', 'Dewahi Gonahi', 'Gadhimai', 'Gujara', 'Ishanath', 'Katahariya', 'Madhav Narayan', 'Maulapur', 'Paroha', 'Phatuwa Bijayapur', 'Rajdevi', 'Rajpur', 'Durga Bhagwati', 'Yamunamai'],
  Saptari: ['Rajbiraj', 'Kanchanrup', 'Dakneshwari', 'Bodebarsain', 'Khadak', 'Shambhunath', 'Surunga', 'Hanumannagar Kankalini', 'Saptakoshi', 'Agnisaira Krishnasavaran', 'Balan-Bihul', 'Bishnupur', 'Chhinnamasta', 'Mahadeva', 'Rupani', 'Tilathi Koiladi', 'Tirahut', 'Rajgadh'],
  Siraha: ['Lahan', 'Siraha', 'Golbazar', 'Mirchaiya', 'Kalyanpur', 'Karjanha', 'Sukhipur', 'Dhangadhimai', 'Bhagawanpur', 'Aurahi', 'Bishnupur', 'Bariyarpatti', 'Lakshmipur Patari', 'Naraha', 'Sakhuwanankarkatti', 'Arnama', 'Nawarajpur', 'Bhagwanpur'],

  // ---- Lumbini ----
  Rupandehi: ['Butwal Sub-Metropolitan City', 'Siddharthanagar', 'Devdaha', 'Lumbini Sanskritik', 'Sainamaina', 'Tilottama', 'Gaidahawa', 'Kanchan', 'Kotahimai', 'Marchawari', 'Mayadevi', 'Om Satiya', 'Rohini', 'Sammarimai', 'Siyari', 'Sudhdhodhan'],
  Dang: ['Ghorahi Sub-Metropolitan City', 'Tulsipur Sub-Metropolitan City', 'Lamahi', 'Banglachuli', 'Dangisharan', 'Gadhawa', 'Rajpur', 'Rapti', 'Shantinagar', 'Babai'],
  Banke: ['Nepalgunj Sub-Metropolitan City', 'Kohalpur', 'Baijanath', 'Duduwa', 'Janaki', 'Khajura', 'Narainapur', 'Rapti Sonari'],
  Bardiya: ['Gulariya', 'Rajapur', 'Madhuwan', 'Thakurbaba', 'Bansgadhi', 'Barbardiya', 'Badhaiyatal', 'Geruwa'],
  Kapilvastu: ['Kapilvastu', 'Banganga', 'Buddhabhumi', 'Shivaraj', 'Krishnanagar', 'Maharajgunj', 'Mayadevi', 'Yashodhara', 'Bijaynagar', 'Suddhodhan'],
  Palpa: ['Tansen', 'Rampur', 'Rainadevi Chhahara', 'Ribdikot', 'Bagnaskali', 'Nisdi', 'Mathagadhi', 'Tinau', 'Purbakhola', 'Rambha'],
  Gulmi: ['Resunga', 'Musikot', 'Isma', 'Kaligandaki', 'Gulmidarbar', 'Satyawati', 'Chandrakot', 'Ruru', 'Chhatrakot', 'Dhurkot', 'Madane', 'Malika'],
  Arghakhanchi: ['Sandhikharka', 'Sitganga', 'Bhumikasthan', 'Chhatradev', 'Panini', 'Malarani'],
  Pyuthan: ['Pyuthan', 'Sworgadwari', 'Gaumukhi', 'Mandavi', 'Sarumarani', 'Mallarani', 'Naubahini', 'Jhimruk', 'Airawati'],
  Rolpa: ['Rolpa', 'Runtigadhi', 'Triveni', 'Sunilsmriti', 'Lungri', 'Sunchhahari', 'Thawang', 'Madi', 'Gangadev', 'Pariwartan'],
  'Eastern Rukum': ['Rukumkot', 'Chaurjahari', 'Aathbiskot', 'Banphikot', 'Sani Bheri', 'Triveni'],
  'Nawalparasi (West)': ['Bardaghat', 'Ramgram', 'Sunwal', 'Palhinandan', 'Pratappur', 'Sarawal', 'Susta'],

  // ---- Karnali ----
  Surkhet: ['Birendranagar', 'Bheriganga', 'Gurbhakot', 'Panchapuri', 'Lekbeshi', 'Barahatal', 'Chaukune', 'Chingad', 'Simta'],
  Dailekh: ['Narayan', 'Dullu', 'Chamunda Bindrasaini', 'Aathbis', 'Bhagawatimai', 'Gurans', 'Naumule', 'Mahabu', 'Bhairabi', 'Dungeshwar', 'Thantikandh'],
  Jajarkot: ['Bheri', 'Chhedagad', 'Nalgad', 'Junichande', 'Kushe', 'Barekot', 'Shivalaya'],
  Jumla: ['Chandannath', 'Kanakasundari', 'Sinja', 'Hima', 'Tila', 'Guthichaur', 'Tatopani', 'Patarasi'],
  Kalikot: ['Khandachakra', 'Raskot', 'Tilagufa', 'Pachaljharana', 'Sanni Triveni', 'Naraharinath', 'Kalika', 'Mahawai', 'Palata'],
  Salyan: ['Sharada', 'Bagchaur', 'Bangad Kupinde', 'Kalimati', 'Chhatreshwari', 'Darma', 'Kapurkot', 'Kumakh', 'Siddha Kumakh', 'Tribeni'],
  'Western Rukum': ['Musikot', 'Chaurjahari', 'Aathbiskot', 'Banphikot', 'Sani Bheri', 'Triveni'],
  Dolpa: ['Thuli Bheri', 'Tripurasundari', 'Dolpo Buddha', 'Shey Phoksundo', 'Jagadulla', 'Mudkechula', 'Kaike', 'Chharka Tangsong'],
  Humla: ['Simkot', 'Namkha', 'Kharpunath', 'Sarkegad', 'Chankheli', 'Adanchuli', 'Tanjakot'],
  Mugu: ['Chhayanath Rara', 'Mugum Karmarong', 'Soru', 'Khatyad'],

  // ---- Sudurpashchim ----
  Kailali: ['Dhangadhi Sub-Metropolitan City', 'Tikapur', 'Ghodaghodi', 'Lamki Chuha', 'Bhajani', 'Godawari', 'Gauriganga', 'Janaki', 'Bardagoriya', 'Mohanyal', 'Kailari', 'Joshipur', 'Chure'],
  Kanchanpur: ['Bhimdatta', 'Punarbas', 'Bedkot', 'Mahakali', 'Shuklaphanta', 'Belauri', 'Krishnapur', 'Laljhadi', 'Beladevi'],
  Doti: ['Dipayal Silgadhi', 'Shikhar', 'Purbichauki', 'Badikedar', 'Jorayal', 'Sayal', 'Aadarsha', 'K.I. Singh', 'Bogatan Phudsil'],
  Achham: ['Mangalsen', 'Sanphebagar', 'Kamalbazar', 'Panchadewal Binayak', 'Bannigadhi Jayagadh', 'Chaurpati', 'Dhakari', 'Mellekh', 'Ramaroshan', 'Turmakhad'],
  Baitadi: ['Dasharathchand', 'Patan', 'Melauli', 'Purchaudi', 'Surnaya', 'Sigas', 'Shivanath', 'Pancheshwar', 'Dogadakedar', 'Dilasaini'],
  Bajhang: ['Jayaprithvi', 'Bungal', 'Talkot', 'Masta', 'Khaptad Chhanna', 'Thalara', 'Bitthadchir', 'Surma', 'Chabispathivera', 'Durgathali', 'Kedarseu', 'Saipal'],
  Bajura: ['Badimalika', 'Triveni', 'Budhiganga', 'Budhinanda', 'Gaumul', 'Jagannath', 'Swami Kartik Khapar', 'Himali', 'Chhededaha'],
  Darchula: ['Mahakali', 'Shailyashikhar', 'Malikarjun', 'Apihimal', 'Duhun', 'Naugad', 'Marma', 'Lekam', 'Byas'],
  Dadeldhura: ['Amargadhi', 'Parashuram', 'Aalital', 'Bhageshwar', 'Nawadurga', 'Ajaymeru', 'Ganyapadhura'],
};

export function municipalitiesOf(district: string | null | undefined): string[] {
  return (district && MUNICIPALITIES[district]) || [];
}
