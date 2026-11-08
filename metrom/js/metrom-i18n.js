(function () {
    'use strict';

    var language = 'en';
    var originals = new WeakMap();
    var attributes = ['aria-label', 'title', 'placeholder'];
    var messages = {
        'Skip to main content': 'انتقل إلى المحتوى الرئيسي',
        'Metrom home': 'الرئيسية - متروم',
        'Route planner': 'مخطط الرحلات',
        'Planner navigation': 'التنقل في مخطط الرحلات',
        'Primary navigation': 'التنقل الرئيسي',
        'Overview': 'نظرة عامة',
        'Nearby stations': 'المحطات القريبة',
        'Map': 'الخريطة',
        'Journey workspace': 'مساحة تخطيط الرحلة',
        'Plan a Cairo metro trip.': 'خطط لرحلتك بمترو القاهرة.',
        'Select two stations to build the route, fare, transfer guidance, and estimated travel time.': 'اختر محطتين لعرض المسار وسعر التذكرة وإرشادات التبديل ووقت الرحلة المتوقع.',
        'Metro line colors': 'ألوان خطوط المترو',
        'Metro tools sections': 'أقسام أدوات المترو',
        'Network info': 'معلومات الشبكة',
        '01 / Departure': '01 / الانطلاق',
        '02 / Arrival': '02 / الوصول',
        'Starting point': 'نقطة الانطلاق',
        'Destination': 'الوجهة',
        'Select Line:': 'اختر الخط:',
        'Select Station:': 'اختر المحطة:',
        'Choose a line...': 'اختر خطًا...',
        '-- Choose station --': '-- اختر المحطة --',
        'Line 1 (Helwan - El Marg)': 'الخط الأول (حلوان - المرج)',
        'Line 2 (El Monib - Shubra Al Khaimah)': 'الخط الثاني (المنيب - شبرا الخيمة)',
        'Line 3 (Adly Mansour - Ring Road)': 'الخط الثالث (عدلي منصور - فروع الغرب)',
        'Starting metro line': 'خط مترو الانطلاق',
        'Destination metro line': 'خط مترو الوجهة',
        'Starting station': 'محطة الانطلاق',
        'Destination station': 'محطة الوصول',
        'Choose a start and destination station.': 'اختر محطة الانطلاق ومحطة الوصول.',
        'Find Route & Price': 'اعرض المسار والسعر',
        'Swap': 'تبديل',
        'Swap starting point and destination': 'تبديل نقطة الانطلاق والوجهة',
        'Start Traveling': 'ابدأ الرحلة',
        'Stop Traveling': 'أوقف الرحلة',
        'Reset': 'إعادة ضبط',
        'Journey results': 'نتائج الرحلة',
        'Route ready': 'المسار جاهز',
        'Journey summary': 'ملخص الرحلة',
        'Total Stations': 'عدد المحطات',
        'Ticket Price': 'سعر التذكرة',
        'Elderly / Army / Police': 'كبار السن / الجيش / الشرطة',
        'Special Needs': 'ذوو الهمم',
        'Estimated Trip Time': 'وقت الرحلة المتوقع',
        'Complete Route': 'المسار الكامل',
        'Route stations in travel order': 'المحطات حسب ترتيب الرحلة',
        'Find Closest Station by Coordinates': 'اعثر على أقرب محطة بالإحداثيات',
        'Enter current and destination coordinates, paste a location link, or use live location.': 'أدخل إحداثيات موقعك والوجهة، أو الصق رابط الموقع، أو استخدم موقعك الحالي.',
        'Current Location Link': 'رابط الموقع الحالي',
        'Destination Location Link': 'رابط موقع الوجهة',
        'Paste Google Maps / Apple Maps / Waze / OSM link or lat,lng': 'الصق رابط خرائط Google / Apple / Waze / OSM أو خط العرض والطول',
        'Paste location app link or lat,lng': 'الصق رابط الموقع أو خط العرض والطول',
        'Current Latitude': 'خط العرض الحالي',
        'Current Longitude': 'خط الطول الحالي',
        'Destination Latitude': 'خط عرض الوجهة',
        'Destination Longitude': 'خط طول الوجهة',
        'e.g. 30.0444': 'مثال: 30.0444',
        'e.g. 31.2357': 'مثال: 31.2357',
        'e.g. 30.0100': 'مثال: 30.0100',
        'e.g. 31.2000': 'مثال: 31.2000',
        'Import coordinates': 'استيراد الإحداثيات',
        'Use live location': 'استخدم موقعي الحالي',
        'Closest station to me': 'أقرب محطة إليّ',
        'Find closest start & end': 'أقرب محطة للانطلاق والوصول',
        'Closest-station results will appear here.': 'ستظهر هنا نتائج أقرب المحطات.',
        'Ticket Fares': 'أسعار التذاكر',
        'Metro Fare Table': 'جدول أسعار تذاكر المترو',
        'Trip length': 'طول الرحلة',
        'Standard': 'التذكرة العادية',
        'Age 60+, army & police': '60 سنة فأكثر والجيش والشرطة',
        'Special needs & veterans': 'ذوو الهمم والمحاربون القدامى',
        'Metro lines and stations': 'خطوط المترو والمحطات',
        'Metro Lines and Stations Table': 'جدول خطوط المترو والمحطات',
        'Line': 'الخط',
        'Route': 'المسار',
        'Stations': 'المحطات',
        'Line 1': 'الخط الأول',
        'Line 2': 'الخط الثاني',
        'Line 3': 'الخط الثالث',
        'Line 3 branch': 'فرع الخط الثالث',
        'Line 1 stations': 'محطات الخط الأول',
        'Line 2 stations': 'محطات الخط الثاني',
        'Line 3 stations': 'محطات الخط الثالث',
        'Line 3 Cairo University branch stations': 'محطات فرع جامعة القاهرة بالخط الثالث',
        'Helwan to New El-Marg': 'حلوان إلى المرج الجديدة',
        'El Monib to Shubra Al Khaimah': 'المنيب إلى شبرا الخيمة',
        'Adly Mansour to Rod El Farag Corridor': 'عدلي منصور إلى محور روض الفرج',
        'Kit Kat to Cairo University': 'الكيت كات إلى جامعة القاهرة',
        'Network view': 'عرض الشبكة',
        'Cairo Metro map': 'خريطة مترو القاهرة',
        'Map line legend': 'دليل خطوط الخريطة',
        'OpenStreetMap street tiles with a local metro map fallback. No API key required.': 'خريطة شوارع OpenStreetMap مع خريطة مترو محلية بديلة. لا تحتاج إلى مفتاح API.',
        'Use local map': 'استخدم الخريطة المحلية',
        'Show street map': 'اعرض خريطة الشوارع',
        'Loading street map tiles...': 'جارٍ تحميل خريطة الشوارع...',
        'Street tiles require HTTP(S). Showing the local metro map.': 'تتطلب خريطة الشوارع HTTP(S). يتم عرض خريطة المترو المحلية.',
        'Street map tiles provided by OpenStreetMap.': 'خريطة الشوارع مقدمة من OpenStreetMap.',
        'You are offline. Showing the local metro map.': 'لا يوجد اتصال بالإنترنت. يتم عرض خريطة المترو المحلية.',
        'Showing the local metro map. Street tiles are turned off.': 'يتم عرض خريطة المترو المحلية. خريطة الشوارع متوقفة.',
        'Some street tiles could not load. The local map remains available.': 'تعذر تحميل بعض أجزاء خريطة الشوارع. الخريطة المحلية ما زالت متاحة.',
        'Street tiles are unavailable. Showing the local metro map. Use Show street map to retry.': 'خريطة الشوارع غير متاحة. يتم عرض خريطة المترو المحلية. اضغط على اعرض خريطة الشوارع للمحاولة مجددًا.',
        'contributors': 'المساهمون',
        'Metrom local network map': 'خريطة شبكة متروم المحلية',
        'Metrom local network map, ©': 'خريطة شبكة متروم المحلية، ©',
        'Toggle station area bounds': 'إظهار أو إخفاء حدود المحطات',
        'Zoom in': 'تكبير',
        'Zoom out': 'تصغير',
        'Marker': 'محطة',
        'Close popup': 'إغلاق النافذة',
        'Travel mode is off. GPS needs location permission and HTTPS. Estimated speeds are labeled; underground tracking is limited and pauses without a reliable fix.': 'وضع الرحلة متوقف. يحتاج GPS إلى إذن الموقع واتصال HTTPS. تُميّز السرعات التقديرية؛ التتبع تحت الأرض محدود ويتوقف عند غياب موقع موثوق.',
        'Travel mode is off.': 'وضع الرحلة متوقف.',
        'Travel mode stopped.': 'تم إيقاف وضع الرحلة.',
        'Travel mode unavailable: geolocation is not supported by this browser.': 'وضع الرحلة غير متاح: هذا المتصفح لا يدعم تحديد الموقع.',
        'Travel mode requires HTTPS or localhost for location access.': 'يتطلب وضع الرحلة HTTPS أو localhost للوصول إلى الموقع.',
        'Please find a valid route first, then start traveling.': 'اعثر على مسار صالح أولًا، ثم ابدأ الرحلة.',
        'Travel mode active. Waiting for live location updates...': 'وضع الرحلة نشط. في انتظار تحديثات الموقع...',
        'Location permission was denied. Enable location access to use travel mode.': 'تم رفض إذن الموقع. اسمح بالوصول إلى الموقع لاستخدام وضع الرحلة.',
        'You reached near your destination station. Travel mode stopped automatically.': 'وصلت بالقرب من محطة وجهتك. توقف وضع الرحلة تلقائيًا.',
        'GPS returned invalid coordinates. Waiting for a valid fix.': 'أعاد GPS إحداثيات غير صالحة. في انتظار موقع صالح.',
        'GPS accuracy is unavailable. Waiting for a valid fix.': 'دقة GPS غير متاحة. في انتظار موقع صالح.',
        'GPS returned an outdated fix. Waiting for a fresh location.': 'أعاد GPS موقعًا قديمًا. في انتظار موقع حديث.',
        'GPS location jumped unexpectedly. Waiting for a consistent fix.': 'تغير موقع GPS بصورة غير متوقعة. في انتظار موقع مستقر.',
        'GPS location is away from the planned route. Check your route or wait for a better fix.': 'موقع GPS بعيد عن المسار المخطط. تحقق من المسار أو انتظر موقعًا أدق.',
        'GPS signal unavailable. Position held while waiting for a reliable fix.': 'إشارة GPS غير متاحة. تم تثبيت الموضع في انتظار موقع موثوق.',
        'GPS estimate limit reached. Position held while waiting for a reliable fix.': 'تم بلوغ حد تقدير GPS. تم تثبيت الموضع في انتظار موقع موثوق.',
        'Journey changed. Find the route again to refresh the summary.': 'تغيرت الرحلة. اعرض المسار مجددًا لتحديث الملخص.',
        'Start and destination swapped.': 'تم تبديل نقطة الانطلاق والوجهة.',
        'Select both a starting station and a destination.': 'اختر محطة الانطلاق ومحطة الوصول.',
        'Start and destination must be different stations.': 'يجب أن تختلف محطة الانطلاق عن محطة الوصول.',
        'No transfer required on this trip.': 'لا تحتاج هذه الرحلة إلى تبديل الخط.',
        'Route ready. Review the journey summary below.': 'المسار جاهز. راجع ملخص الرحلة أدناه.',
        'Live location is not supported in this browser.': 'هذا المتصفح لا يدعم تحديد الموقع الحالي.',
        'Live location requires HTTPS or localhost for location access.': 'يتطلب تحديد الموقع الحالي HTTPS أو localhost.',
        'Fetching live location... waiting for best GPS fix.': 'جارٍ تحديد موقعك الحالي... في انتظار أدق موقع GPS.',
        'Could not get live location. Please enter coordinates manually.': 'تعذر تحديد موقعك الحالي. أدخل الإحداثيات يدويًا.',
        'Please enter valid current coordinates.': 'أدخل إحداثيات صالحة لموقعك الحالي.',
        'Please enter valid current and destination coordinates.': 'أدخل إحداثيات صالحة لموقعك الحالي والوجهة.',
        'Station coordinate data is not loaded yet.': 'لم تُحمّل إحداثيات المحطات بعد.',
        'Resolving coordinates...': 'جارٍ استخراج الإحداثيات...',
        'Imported both current and destination coordinates from links.': 'تم استيراد إحداثيات الموقع الحالي والوجهة من الروابط.',
        'Imported current coordinates from link. Add destination link (or manual destination coordinates) to continue.': 'تم استيراد إحداثيات الموقع الحالي. أضف رابط الوجهة أو إحداثياتها للمتابعة.',
        'Imported destination coordinates from link. Add current link (or manual current coordinates) to continue.': 'تم استيراد إحداثيات الوجهة. أضف رابط موقعك الحالي أو إحداثياته للمتابعة.',
        'Could not read coordinates from the provided link(s). If using a Google Maps short link, try right-clicking the location and choosing "Share" for a full link.': 'تعذر قراءة الإحداثيات من الروابط. إذا كان رابط خرائط Google مختصرًا، جرّب النقر بزر الفأرة الأيمن على الموقع واختيار "مشاركة" للحصول على رابط كامل.',
        'Paste a current and/or destination map link first. Supports Google Maps (full/short links), Plus Codes (e.g., V82R+FV), Apple Maps, Waze, OSM, geo links, and lat,lng text.': 'الصق أولًا رابط الموقع الحالي أو الوجهة. يدعم روابط Google Maps وأكواد Plus وApple Maps وWaze وOSM وروابط geo ونص خط العرض والطول.',
        'Warning: low accuracy fix. Consider entering coordinates manually.': 'تحذير: دقة الموقع منخفضة. يُفضل إدخال الإحداثيات يدويًا.',
        'Medium accuracy fix.': 'دقة الموقع متوسطة.',
        'High accuracy fix.': 'دقة الموقع عالية.',
        'Your position': 'موقعك',
        'Current location': 'الموقع الحالي',
        'Destination coordinate': 'إحداثيات الوجهة',
        'Line 3 service': 'خدمة الخط الثالث',
        'Capabilities': 'الإمكانات',
        'Plan a route': 'خطط لمسار',
        'Cairo Metro Navigator': 'دليل مترو القاهرة',
        'Cairo, station by station.': 'القاهرة، محطة تلو الأخرى.',
        'Build a route across Cairo’s metro network, compare fares and travel time, then follow your journey from the map.': 'خطط لمسارك عبر شبكة مترو القاهرة، وقارن الأسعار ووقت الرحلة، ثم تابع رحلتك على الخريطة.',
        'Plan a journey': 'خطط لرحلة',
        'Explore the system': 'استكشف الشبكة',
        'Network summary': 'ملخص الشبكة',
        'active lines': 'خطوط عاملة',
        'mapped stations': 'محطة على الخريطة',
        'Live': 'مباشر',
        'journey tracking': 'تتبع الرحلة',
        'Cairo Metro lines': 'خطوط مترو القاهرة',
        'Helwan ↔ New El-Marg': 'حلوان ↔ المرج الجديدة',
        'El Monib ↔ Shubra': 'المنيب ↔ شبرا',
        'Adly Mansour ↔ West branches': 'عدلي منصور ↔ فروع الغرب',
        'Built for movement': 'مصمم للتنقل',
        'One workspace for the whole trip.': 'مساحة واحدة لرحلتك كاملة.',
        'From choosing stations to understanding the route on the ground, each tool stays connected to the same network data.': 'من اختيار المحطات إلى فهم المسار، تعتمد كل الأدوات على بيانات الشبكة نفسها.',
        'Network map': 'خريطة الشبكة',
        'Interactive map of all three Cairo Metro lines with accurate station information and connections.': 'خريطة تفاعلية لخطوط مترو القاهرة الثلاثة مع معلومات المحطات والتبديلات.',
        'Fare and timing': 'السعر والوقت',
        'Get accurate fare prices for any journey between stations on Cairo Metro lines.': 'اعرف أسعار التذاكر لرحلتك بين محطات مترو القاهرة.',
        'Nearest stations': 'أقرب المحطات',
        'Find the closest metro station by entering your GPS coordinates or current location.': 'اعثر على أقرب محطة مترو باستخدام إحداثيات GPS أو موقعك الحالي.',
        'Travel mode': 'وضع الرحلة',
        'Access metro information anytime, anywhere on your phone while traveling in Cairo.': 'اطّلع على معلومات المترو من هاتفك أثناء تنقلك في القاهرة.',
        'Back to overview': 'العودة إلى النظرة العامة',
        'Open route planner': 'افتح مخطط الرحلات',
        '/ Metrom route planner': '/ مخطط رحلات متروم',
        'Mivex | Cairo Metro Route Planner': 'Mivex | مخطط رحلات مترو القاهرة',
        'Mivex | Cairo Metro Navigator': 'Mivex | دليل مترو القاهرة',
        'User denied Geolocation': 'رفض المستخدم إذن تحديد الموقع',
        'User denied geolocation': 'رفض المستخدم إذن تحديد الموقع',
        'Timeout expired': 'انتهت مهلة تحديد الموقع',
        'Position unavailable': 'الموقع غير متاح',
        '→': '←'
    };

    var stations = {
        'Helwan': 'حلوان', 'Ain Helwan': 'عين حلوان', 'Helwan University': 'جامعة حلوان',
        'Wadi Hof': 'وادي حوف', 'Hadayeq Helwan': 'حدائق حلوان', 'Elmasraa': 'المعصرة',
        'Tura El-Asmant': 'طرة الأسمنت', 'Kozzika': 'كوتسيكا', 'Tura El-Balad': 'طرة البلد',
        'Sakanat El-Maadi': 'ثكنات المعادي', 'Maadi': 'المعادي', 'Hadayeq El-Maadi': 'حدائق المعادي',
        'Dar El-Salam': 'دار السلام', 'El-Zahraa': 'الزهراء', 'Mar Girgis': 'مار جرجس',
        'El-Malek El-Saleh': 'الملك الصالح', 'Al-Sayeda Zeinab': 'السيدة زينب',
        'Saad Zaghloul': 'سعد زغلول', 'Sadat': 'السادات', 'Nasser': 'ناصر', 'Urabi': 'عرابي',
        'Al Shohadaa': 'الشهداء', 'Ghamra': 'غمرة', 'El-Demerdash': 'الدمرداش',
        'Manshiet El-Sadr': 'منشية الصدر', 'Kobri El-Qobba': 'كوبري القبة',
        'Hammamat El-Qobba': 'حمامات القبة', 'Saray El-Qobba': 'سراي القبة',
        'Hadayeq El-Zaitoun': 'حدائق الزيتون', 'Helmeyet El-Zaitoun': 'حلمية الزيتون',
        'El-Matareyya': 'المطرية', 'Ain Shams': 'عين شمس', 'Ezbet El-Nakhl': 'عزبة النخل',
        'El-Marg': 'المرج', 'New El-Marg': 'المرج الجديدة', 'El Monib': 'المنيب',
        'Sakiat Mekky': 'ساقية مكي', 'Omm El-Masryeen': 'أم المصريين', 'Giza': 'الجيزة',
        'Faisal': 'فيصل', 'Cairo University': 'جامعة القاهرة', 'Bohooth': 'البحوث',
        'Dokki': 'الدقي', 'Opera': 'الأوبرا', 'Mohamed Naguib': 'محمد نجيب', 'Ataba': 'العتبة',
        'Masarra': 'مسرة', 'Rod El-Farag': 'روض الفرج', 'St. Teresa': 'سانت تريزا',
        'Khalafawy': 'الخلفاوي', 'Mezallat': 'المظلات', 'Koliet El-Zeraa': 'كلية الزراعة',
        'Shubra Al Khaimah': 'شبرا الخيمة', 'Adly Mansour': 'عدلي منصور', 'Heykestep': 'الهايكستب',
        'Omar Ibn Al Khattab': 'عمر بن الخطاب', 'Qebaa': 'قباء', 'Hesham Barakat': 'هشام بركات',
        'El Nozha': 'النزهة', 'Nadi El Shams': 'نادي الشمس', 'Alf Maskan': 'ألف مسكن',
        'Heliopolis': 'هليوبوليس', 'Haroun': 'هارون', 'Al Ahram': 'الأهرام',
        'Koleyet El Banat': 'كلية البنات', 'Cairo Stadium': 'الاستاد', 'Fair Zone': 'أرض المعارض',
        'Abbassiya': 'العباسية', 'Abdou Pasha': 'عبده باشا', 'El Geish': 'الجيش',
        'Bab El Shaaria': 'باب الشعرية', 'Maspero': 'ماسبيرو', 'Safaa Hegazy': 'صفاء حجازي',
        'Kit Kat': 'الكيت كات', 'Sudan St.': 'السودان', 'Imbaba': 'إمبابة', 'El Bohy': 'البوهي',
        'El-Qawmia': 'القومية العربية', 'Ring Rd.': 'الطريق الدائري',
        'Rod El Farag Corridor': 'محور روض الفرج', 'Tawfikia': 'التوفيقية', 'Wadi El Nile': 'وادي النيل',
        'Gamat El Dowal': 'جامعة الدول', 'Boulak El Dakrour': 'بولاق الدكرور'
    };
    var aliases = {
        'Hadayek Helwan': 'Hadayeq Helwan', 'El-Maasara': 'Elmasraa',
        'Tora El-Asmant': 'Tura El-Asmant', 'Tora El-Balad': 'Tura El-Balad',
        'Hadayek El-Maadi': 'Hadayeq El-Maadi', 'Orabi': 'Urabi', 'Al-Shohadaa': 'Al Shohadaa',
        'El-Mounib': 'El Monib', 'El Giza': 'Giza', 'El Bohoth': 'Bohooth', 'Attaba': 'Ataba',
        'Road El-Farag': 'Rod El-Farag', 'Kolleyyet El-Zeraa': 'Koliet El-Zeraa',
        'Shubra El-Kheima': 'Shubra Al Khaimah', 'El Haykestep': 'Heykestep',
        'Omar Ibn El-Khattab': 'Omar Ibn Al Khattab', 'Qobaa': 'Qebaa', 'El-Nozha': 'El Nozha',
        'Nadi El-Shams': 'Nadi El Shams', 'Heliopolis Square': 'Heliopolis', 'Al-Ahram': 'Al Ahram',
        'Koleyet El-Banat': 'Koleyet El Banat', 'Stadium': 'Cairo Stadium', 'Abbassia': 'Abbassiya',
        'Sudan': 'Sudan St.', 'El-Bohy': 'El Bohy', 'Ring Road': 'Ring Rd.',
        'Rod al-Farag Corridor': 'Rod El Farag Corridor'
    };
    Object.keys(aliases).forEach(function (alias) { stations[alias] = stations[aliases[alias]]; });

    var templates = {
        'Up to {count} stations': 'حتى {count} محطات',
        '{value} EGP': '{value} جنيه',
        '{time} min ({distance} km)': '{time} دقيقة ({distance} كم)',
        'Speed: {speed} km/h': 'السرعة: {speed} كم/س',
        'Speed (est.): {speed} km/h': 'السرعة (تقديرية): {speed} كم/س',
        'Transfer at {station}. Take {line} toward {terminal}.': 'بدّل في {station}. استقل {line} باتجاه {terminal}.',
        'Transfer at {station} to {line}.': 'بدّل في {station} إلى {line}.',
        'Route start: {station}': 'بداية المسار: {station}',
        'Route end: {station}': 'نهاية المسار: {station}',
        'Transfer station: {station} ⇄': 'محطة التبديل: {station} ⇄',
        'Closest station: {station} ({line})': 'أقرب محطة: {station} ({line})',
        'Closest start station: {station}': 'أقرب محطة للانطلاق: {station}',
        'Closest end station: {station}': 'أقرب محطة للوصول: {station}',
        'Closest station now: {station} ({line}) - approx {distance} km away.': 'أقرب محطة الآن: {station} ({line}) - تبعد نحو {distance} كم.',
        'Closest start: {start} ({startLine}) - {startDistance} km. Closest destination: {end} ({endLine}) - {endDistance} km. Route fields auto-filled.': 'أقرب محطة للانطلاق: {start} ({startLine}) - {startDistance} كم. أقرب محطة للوجهة: {end} ({endLine}) - {endDistance} كم. تم ملء حقول الرحلة تلقائيًا.',
        'Traveling: nearest station is {station} on {line}. Remaining to destination ~{distance} m{accuracy}.': 'أثناء الرحلة: أقرب محطة هي {station} على {line}. المسافة المتبقية للوجهة نحو {distance} م{accuracy}.',
        'GPS weak/underground detected, approximating along route. {status}': 'إشارة GPS ضعيفة أو تحت الأرض؛ يتم تقدير الموضع على المسار. {status}',
        '(±{accuracy} m)': '(±{accuracy} م)',
        'GPS accuracy is too low (±{accuracy} m). Waiting for a better fix.': 'دقة GPS منخفضة جدًا (±{accuracy} م). في انتظار موقع أدق.',
        'Travel mode error: {error}': 'خطأ في وضع الرحلة: {error}',
        'Could not get live location: {error}': 'تعذر تحديد الموقع الحالي: {error}',
        'Live location set to {lat}, {lng} (accuracy ±{accuracy} m).{quality}': 'تم تحديد الموقع الحالي: {lat}، {lng} (الدقة ±{accuracy} م).{quality}',
        'Line: {line}': 'الخط: {line}',
        'Opened: {year}': 'الافتتاح: {year}',
        'Coord: {coordinates}': 'الإحداثيات: {coordinates}',
        'Cannot download bounds: station map data is not loaded yet.': 'تعذر تنزيل الحدود: لم تُحمّل بيانات خريطة المحطات بعد.',
        'Cannot download stations: station map data is not loaded yet.': 'تعذر تنزيل المحطات: لم تُحمّل بيانات الخريطة بعد.',
        'Downloaded station bounds GeoJSON ({count} stations).': 'تم تنزيل حدود المحطات بصيغة GeoJSON ({count} محطة).',
        'Downloaded station points GeoJSON ({count} stations).': 'تم تنزيل نقاط المحطات بصيغة GeoJSON ({count} محطة).'
    };
    var patterns = Object.keys(templates).map(function (source) {
        var names = [];
        var expression = source.split(/(\{[^}]+\})/).map(function (part) {
            if (/^\{[^}]+\}$/.test(part)) {
                names.push(part.slice(1, -1));
                return '(.*?)';
            }
            return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        return { expression: new RegExp('^' + expression + '$'), names: names, output: templates[source] };
    });

    function translate(value) {
        if (language !== 'ar') return value;
        var text = value.trim();
        var translated = messages[text] || stations[text];
        if (!translated && text.indexOf(' → ') !== -1) {
            translated = text.split(' → ').map(translate).join(' ← ');
        }
        if (!translated) {
            for (var i = 0; i < patterns.length; i++) {
                var pattern = patterns[i];
                var match = text.match(pattern.expression);
                if (!match) continue;
                translated = pattern.output.replace(/\{([^}]+)\}/g, function (_, name) {
                    return translate(match[pattern.names.indexOf(name) + 1]);
                });
                break;
            }
        }
        if (!translated) return value;
        return value.slice(0, value.indexOf(text)) + translated + value.slice(value.indexOf(text) + text.length);
    }

    function excluded(element) {
        return !element || element.closest('script, style, [data-no-i18n]');
    }

    function translateValue(node, key, value, write) {
        var record = originals.get(node);
        if (!record) {
            record = {};
            originals.set(node, record);
        }
        var previous = record[key];
        // Keep the English source when switching language; accept new planner/GPS output.
        var source = previous && previous.rendered === value ? previous.source : value;
        var rendered = translate(source);
        record[key] = { source: source, rendered: rendered };
        if (rendered !== value) write(rendered);
    }

    function translateNode(node) {
        if (excluded(node.parentElement)) return;
        translateValue(node, 'text', node.data, function (value) { node.data = value; });
    }

    function translateAttributes(element) {
        if (excluded(element)) return;
        attributes.forEach(function (name) {
            if (!element.hasAttribute(name)) return;
            translateValue(element, name, element.getAttribute(name), function (value) {
                element.setAttribute(name, value);
            });
        });
    }

    function translateTree(root) {
        if (root.nodeType === 3) {
            translateNode(root);
            return;
        }
        if (root.nodeType !== 1 || excluded(root)) return;
        translateAttributes(root);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) translateNode(walker.currentNode);
        root.querySelectorAll('[aria-label], [title], [placeholder]').forEach(translateAttributes);
    }

    function setLanguage(nextLanguage) {
        if (nextLanguage !== 'en' && nextLanguage !== 'ar') {
            throw new Error('Unsupported Metrom language: ' + nextLanguage);
        }
        language = nextLanguage;
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        var languageMeta = document.querySelector('meta[name="language"]');
        if (languageMeta) languageMeta.content = language === 'ar' ? 'Arabic' : 'English';
        translateTree(document.documentElement);
        document.querySelectorAll('[data-language-toggle]').forEach(function (button) {
            button.textContent = language === 'ar' ? 'English' : 'العربية';
            button.lang = language === 'ar' ? 'en' : 'ar';
            button.setAttribute('aria-label', language === 'ar' ? 'Switch to English' : 'Switch to Arabic');
        });
        try {
            window.localStorage.setItem('metrom-language', language);
        } catch (error) {
            console.warn('Metrom cannot save the language preference:', error);
        }
    }

    function initialize() {
        var saved = null;
        try {
            saved = window.localStorage.getItem('metrom-language');
        } catch (error) {
            console.warn('Metrom cannot read the language preference:', error);
        }
        setLanguage(saved === 'ar' ? 'ar' : 'en');
        document.querySelectorAll('[data-language-toggle]').forEach(function (button) {
            button.addEventListener('click', function () { setLanguage(language === 'ar' ? 'en' : 'ar'); });
        });

        // The legacy planner and Leaflet replace text nodes; translate only changed UI subtrees.
        new MutationObserver(function (changes) {
            changes.forEach(function (change) {
                if (change.type === 'characterData') translateNode(change.target);
                else if (change.type === 'attributes') translateAttributes(change.target);
                else change.addedNodes.forEach(translateTree);
            });
        }).observe(document.documentElement, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: attributes
        });
    }

    window.MetroI18n = { translate: translate, setLanguage: setLanguage };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
}());
