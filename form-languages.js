
window.APP_LANG='ro';
const EN_STEPS=[
['IDENTITY','What is your first name?','Let’s start with you.','first','First name','text'],
['IDENTITY','What is your last name?','Enter your family name.','last','Last name','text'],
['YOUR OPTICAL STORE','Which optical store do you represent?','Enter the name of the optical store.','optic','Optical store name','text'],
['YOUR OPTICAL STORE','What is your role?','Select the role that best describes you.','role','','role'],
['LOCATION','Which locality is your optical store in?','Let’s build the address step by step.','city','Locality','text'],
['LOCATION','County or district','The county or district where your optical store is located.','county','County / district','text'],
['LOCATION','Street and number','Enter the street and building number.','street','Street, number','text'],
['CONTACT','Your phone number','The country prefix is selected automatically from the locality.','phone','','tel'],
['CONTACT','Your email address','Your email is required for the confirmation and reminder.','email','name@example.com','email'],
['PERSPECTIVE','How do you approach myopia?','Do you use dedicated myopia management solutions?','myopia','','q1'],
['Myoless','How familiar are you with Myoless?','Choose the option that best describes you.','myoless','','q2']
];
const RO_STEPS=A.map(x=>x.slice());
const EN_TEXT=new Map(Object.entries({
'Managementul miopiei':'Myopia management','dincolo':'beyond',' de lentilă:':' the lens:','ÎNSCRIE-TE LA PREZENTARE':'REGISTER FOR THE PRESENTATION','Cum educăm o generație să vadă mai bine.':'How do we educate a generation to see better.','SNOO · 2026 · ROMÂNIA':'SNOO · 2026 · ROMANIA',
'ACORDURI':'CONSENTS','CONFIDENȚIALITATE':'PRIVACY','Acorduri':'Consents',
'Pentru a continua înscrierea, avem nevoie de acordurile tale privind prelucrarea datelor cu caracter personal și utilizarea imaginilor foto/video realizate în cadrul evenimentului, în scopurile descrise mai jos.':'To continue your registration, we need your consent for the processing of your personal data and for the use of photo/video images taken during the event, for the purposes described below.',
'Sunt de acord cu prelucrarea datelor mele cu caracter personal în scopul înscrierii și gestionării participării la eveniment.':'I consent to the processing of my personal data for registration and management of my participation in the event.',
'Sunt de acord ca imaginile foto/video realizate în cadrul evenimentului în care pot apărea să fie utilizate de Avvero în scopul comunicării și promovării evenimentului, inclusiv pe website și canalele de social media.':'I consent to Avvero using photo/video images taken during the event in which I may appear for communication and promotion of the event, including on the website and social media channels.',
'Pentru a continua, trebuie să bifezi ambele acorduri.':'To continue, you must accept both consents.',
'Medic oftalmolog':'Ophthalmologist','Optometrist':'Optometrist','Administrator':'Administrator','Consilier vânzări':'Sales consultant','Altul':'Other',
'Da, folosim deja soluții dedicate':'Yes, we already use dedicated solutions','Nu încă, vrem să descoperim opțiunile':'Not yet, we want to explore the options','Da, cunosc Myoless':'Yes, I know Myoless','Nu încă. Vreau să îl descopăr.':'Not yet. I want to discover it.',
'ÎNSCRIERE CONFIRMATĂ':'REGISTRATION CONFIRMED','Bine ai venit,':'Welcome,','Locul tău la prezentarea Avvero este rezervat.':'Your place at the Avvero presentation is reserved.',
'Sâmbătă, 17 octombrie 2026 · 17:15':'Saturday, 17 October 2026 · 17:15','ROMEXPO, București':'ROMEXPO, Bucharest','Cadoul tău surpriză te așteaptă la prezentare.':'Your surprise gift will be waiting for you at the presentation.',
'ÎNCHIDE':'CLOSE','ADAUGĂ ÎN CALENDAR':'ADD TO CALENDAR','REVENIRE LA PAGINA PRINCIPALĂ':'RETURN TO HOME PAGE',
'Finalizăm înscrierea.':'Completing your registration.','Salvăm datele și rezervăm locul tău la prezentare.':'We are saving your details and reserving your place at the presentation.',
'SE SALVEAZĂ':'SAVING','CONFIRMAT':'CONFIRMED','NECONFIRMAT':'NOT CONFIRMED',
'Numărul este deja înscris.':'This phone number is already registered.','Înscrierea nu a fost salvată.':'Your registration was not saved.',
'Există deja o participare asociată acestui număr de telefon.':'A registration is already associated with this phone number.',
'Verifică conexiunea și încearcă din nou. Locul nu este considerat rezervat până la confirmare.':'Check your connection and try again. Your place is not reserved until confirmation.',
'REÎNCEARCĂ →':'TRY AGAIN →',
'Completează acest câmp pentru a continua.':'Complete this field to continue.','Introdu adresa ta de e-mail pentru a continua.':'Enter your email address to continue.','Introdu o adresă de e-mail validă.':'Enter a valid email address.','Introdu și numărul imobilului.':'Please also enter the building number.','Introdu un număr de telefon valid.':'Enter a valid phone number.','Selectează o opțiune pentru a continua.':'Select an option to continue.','Acest număr de telefon este deja asociat unei rezervări.':'This phone number is already linked to a registration.','Verificăm numărul…':'Checking the number…','Nu am putut verifica numărul acum. Poți încerca din nou.':'We could not check the number right now. Please try again.',
'SE SALVEAZĂ':'SAVING','Finalizăm înscrierea.':'Finalising your registration.','Salvăm datele și rezervăm locul tău la prezentare.':'We are saving your details and reserving your place at the presentation.','CONFIRMAT':'CONFIRMED','ÎNSCRIERE CONFIRMATĂ':'REGISTRATION CONFIRMED','Locul tău la prezentarea Avvero este rezervat.':'Your place at the Avvero presentation is reserved.','Cadoul tău surpriză te așteaptă la prezentare.':'Your surprise gift will be waiting for you at the presentation.','ADAUGĂ ÎN CALENDAR':'ADD TO CALENDAR','REVENIRE LA PAGINA PRINCIPALĂ':'BACK TO HOME','ÎNCHIDE':'CLOSE','NECONFIRMAT':'NOT CONFIRMED','Numărul este deja înscris.':'This phone number is already registered.','Înscrierea nu a fost salvată.':'Your registration was not saved.','Există deja o participare asociată acestui număr de telefon.':'A registration already exists for this phone number.','Verifică conexiunea și încearcă din nou.':'Check your connection and try again.','REÎNCEARCĂ →':'TRY AGAIN →'
}));
const RO_TEXT=new Map(Array.from(EN_TEXT.entries()).map(([ro,en])=>[en,ro]));
const RU_STEPS=[
 ['ЛИЧНЫЕ ДАННЫЕ','Как вас зовут?','Начнём знакомство с вами.','first','Имя','text'],
 ['ЛИЧНЫЕ ДАННЫЕ','Какая у вас фамилия?','Укажите вашу фамилию.','last','Фамилия','text'],
 ['ВАША ОПТИКА','Какую оптику вы представляете?','Укажите название оптики.','optic','Название оптики','text'],
 ['ВАША ОПТИКА','Какова ваша роль в оптике?','Выберите вашу должность.','role','','role'],
 ['АДРЕС','В каком населённом пункте находится оптика?','Укажем адрес шаг за шагом.','city','Населённый пункт','text'],
 ['АДРЕС','Жудец или район','Жудец или район, в котором находится оптика.','county','Жудец / район','text'],
 ['АДРЕС','Улица и номер дома','Укажите улицу и номер дома.','street','Улица, номер дома','text'],
 ['КОНТАКТЫ','Ваш номер телефона','Код страны определяется автоматически по населённому пункту.','phone','','tel'],
 ['КОНТАКТЫ','Ваша электронная почта','Она необходима для подтверждения регистрации и напоминания.','email','name@example.com','email'],
 ['ВАШ ОПЫТ','Как вы подходите к контролю миопии?','Используете ли вы специальные решения для контроля миопии?','myopia','','q1'],
 ['Myoless','Насколько хорошо вы знаете Myoless?','Выберите подходящий вам ответ.','myoless','','q2']
];
const EN_EXTRA={
 'Sugestii județe':'County suggestions','Sugestii raioane':'District suggestions',
 'Verificăm adresa de e-mail…':'Checking the email address…',
 'Această adresă de e-mail este deja asociată unei înscrieri.':'This email address is already linked to a registration.',
 'Nu am putut verifica adresa de e-mail. Încearcă din nou.':'We could not check the email address. Please try again.',
 'Adresa de e-mail este deja înscrisă.':'This email address is already registered.',
 'Există deja o participare asociată acestei adrese de e-mail.':'A registration already exists for this email address.',
 'Ambele acorduri sunt obligatorii pentru a continua.':'Both consents are required to continue.',
 'Selectează o localitate din România sau Republica Moldova din lista afișată.':'Select a locality in Romania or the Republic of Moldova from the list.',
 'Selectează o localitate din lista afișată.':'Select a locality from the list.',
 'Selectează un județ din lista afișată.':'Select a county from the list.',
 'Selectează un raion din lista afișată.':'Select a district from the list.',
 'Județ':'County','Raion':'District',
 'Județul în care se află optica.':'The county where your optical store is located.',
 'Raionul în care se află optica.':'The district where your optical store is located.',
 'Înscriere confirmată.':'Registration confirmed.',
 'Înainte':'Next','Înapoi':'Back','Navigare formular':'Form navigation',
 'Număr de telefon':'Phone number','Stradă și număr':'Street and number',
 'Sugestii localități':'Locality suggestions','România':'Romania','Republica Moldova':'Republic of Moldova'
};
for(const [ro,en] of Object.entries(EN_EXTRA)){EN_TEXT.set(ro,en);RO_TEXT.set(en,ro)}
const RU_TEXT=new Map(Object.entries({
 'Sugestii județe':'Подсказки жудецов','Sugestii raioane':'Подсказки районов',
 'Verificăm adresa de e-mail…':'Проверяем электронную почту…',
 'Această adresă de e-mail este deja asociată unei înscrieri.':'С этим адресом электронной почты уже связана регистрация.',
 'Nu am putut verifica adresa de e-mail. Încearcă din nou.':'Не удалось проверить электронную почту. Попробуйте ещё раз.',
 'Adresa de e-mail este deja înscrisă.':'Этот адрес электронной почты уже зарегистрирован.',
 'Există deja o participare asociată acestei adrese de e-mail.':'С этим адресом электронной почты уже связана регистрация.',
 'Managementul miopiei':'Контроль миопии',
 'ÎNSCRIE-TE LA PREZENTARE':'ЗАРЕГИСТРИРОВАТЬСЯ',
 'Cum educăm o generație să vadă mai bine.':'Как научить целое поколение лучше видеть.',
 'SNOO · 2026 · ROMÂNIA':'SNOO · 2026 · РУМЫНИЯ',
 'ACORDURI':'СОГЛАСИЯ','CONFIDENȚIALITATE':'КОНФИДЕНЦИАЛЬНОСТЬ','Acorduri':'Согласия',
 'Pentru a continua înscrierea, avem nevoie de acordurile tale privind prelucrarea datelor cu caracter personal și utilizarea imaginilor foto/video realizate în cadrul evenimentului, în scopurile descrise mai jos.':'Для продолжения регистрации нам необходимо ваше согласие на обработку персональных данных и использование фото- и видеоматериалов, сделанных во время мероприятия, в целях, описанных ниже.',
 'Sunt de acord cu prelucrarea datelor mele cu caracter personal în scopul înscrierii și gestionării participării la eveniment.':'Я согласен на обработку моих персональных данных для регистрации и организации моего участия в мероприятии.',
 'Sunt de acord ca imaginile foto/video realizate în cadrul evenimentului în care pot apărea să fie utilizate de Avvero în scopul comunicării și promovării evenimentului, inclusiv pe website și canalele de social media.':'Я согласен на использование компанией Avvero фото- и видеоматериалов, сделанных во время мероприятия, на которых я могу присутствовать, для информирования и продвижения мероприятия, в том числе на сайте и в социальных сетях.',
 'Pentru a continua, trebuie să bifezi ambele acorduri.':'Для продолжения отметьте оба согласия.',
 'Ambele acorduri sunt obligatorii pentru a continua.':'Для продолжения необходимы оба согласия.',
 'Medic oftalmolog':'Врач-офтальмолог','Optometrist':'Оптометрист','Administrator':'Администратор','Consilier vânzări':'Продавец-консультант','Altul':'Другое',
 'Da, folosim deja soluții dedicate':'Да, мы уже используем специальные решения',
 'Nu încă, vrem să descoperim opțiunile':'Пока нет, хотим узнать о возможностях',
 'Da, cunosc Myoless':'Да, я знаком с Myoless','Nu încă. Vreau să îl descopăr.':'Пока нет. Хочу познакомиться с Myoless.',
 'ÎNSCRIERE CONFIRMATĂ':'РЕГИСТРАЦИЯ ПОДТВЕРЖДЕНА','Înscriere confirmată.':'Регистрация подтверждена.',
 'Locul tău la prezentarea Avvero este rezervat.':'Ваше место на презентации Avvero забронировано.',
 'Sâmbătă, 17 octombrie 2026 · 17:15':'Суббота, 17 октября 2026 · 17:15','ROMEXPO, București':'ROMEXPO, Бухарест',
 'Cadoul tău surpriză te așteaptă la prezentare.':'Ваш подарок-сюрприз ждёт вас на презентации.',
 'ÎNCHIDE':'ЗАКРЫТЬ','ADAUGĂ ÎN CALENDAR':'ДОБАВИТЬ В КАЛЕНДАРЬ','REVENIRE LA PAGINA PRINCIPALĂ':'НА ГЛАВНУЮ СТРАНИЦУ',
 'Finalizăm înscrierea.':'Завершаем регистрацию.',
 'Salvăm datele și rezervăm locul tău la prezentare.':'Сохраняем ваши данные и бронируем место на презентации.',
 'SE SALVEAZĂ':'СОХРАНЕНИЕ','CONFIRMAT':'ПОДТВЕРЖДЕНО','NECONFIRMAT':'НЕ ПОДТВЕРЖДЕНО',
 'Numărul este deja înscris.':'Этот номер телефона уже зарегистрирован.',
 'Înscrierea nu a fost salvată.':'Не удалось сохранить регистрацию.',
 'Există deja o participare asociată acestui număr de telefon.':'С этим номером телефона уже связана регистрация.',
 'Verifică conexiunea și încearcă din nou. Locul nu este considerat rezervat până la confirmare.':'Проверьте соединение и попробуйте ещё раз. Место считается забронированным только после подтверждения.',
 'Verifică conexiunea și încearcă din nou.':'Проверьте соединение и попробуйте ещё раз.',
 'REÎNCEARCĂ →':'ПОВТОРИТЬ →',
 'Completează acest câmp pentru a continua.':'Заполните это поле для продолжения.',
 'Introdu adresa ta de e-mail pentru a continua.':'Укажите электронную почту для продолжения.',
 'Introdu o adresă de e-mail validă.':'Укажите корректный адрес электронной почты.',
 'Introdu și numărul imobilului.':'Укажите также номер дома.',
 'Introdu un număr de telefon valid.':'Укажите корректный номер телефона.',
 'Selectează o opțiune pentru a continua.':'Выберите вариант для продолжения.',
 'Acest număr de telefon este deja asociat unei rezervări.':'С этим номером телефона уже связана регистрация.',
 'Verificăm numărul…':'Проверяем номер…',
 'Nu am putut verifica numărul acum. Poți încerca din nou.':'Не удалось проверить номер. Попробуйте ещё раз.',
 'Selectează o localitate din România sau Republica Moldova din lista afișată.':'Выберите населённый пункт в Румынии или Республике Молдова из списка.',
 'Selectează o localitate din lista afișată.':'Выберите населённый пункт из списка.',
 'Selectează un județ din lista afișată.':'Выберите жудец из списка.','Selectează un raion din lista afișată.':'Выберите район из списка.',
 'Județ':'Жудец','Raion':'Район',
 'Județul în care se află optica.':'Жудец, в котором находится ваша оптика.',
 'Raionul în care se află optica.':'Район, в котором находится ваша оптика.',
 'Înainte':'Далее','Înapoi':'Назад','Navigare formular':'Навигация по форме',
 'Număr de telefon':'Номер телефона','Stradă și număr':'Улица и номер дома',
 'Sugestii localități':'Подсказки населённых пунктов','România':'Румыния','Republica Moldova':'Республика Молдова'
}));
const RU_TO_RO=new Map(Array.from(RU_TEXT,([ro,ru])=>[ru,ro]));
function uiText(text,language=window.APP_LANG){
 const ro=RO_TEXT.get(text)||RU_TO_RO.get(text)||text;
 return language==='ru'?(RU_TEXT.get(ro)||ro):language==='en'?(EN_TEXT.get(ro)||ro):ro;
}
function translateNode(root=document){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement&&node.parentElement.closest('script,style,textarea,option,.city-suggestion'))continue;
  const raw=node.nodeValue,trim=raw.trim();if(!trim)continue;
  const translated=uiText(trim);if(translated!==trim)node.nodeValue=raw.replace(trim,translated);
 }
 if(root.querySelectorAll)for(const el of root.querySelectorAll('[aria-label]'))el.setAttribute('aria-label',uiText(el.getAttribute('aria-label')));
}
function applyHeroLanguage(){
 const lang=window.APP_LANG,d=document.querySelector('.desktop-title'),m=document.querySelector('.mobile-title'),sub=document.querySelector('.hero .copy>p'),go=document.querySelector('.go'),ev=document.querySelector('.event');
 const copy={
  ro:['Managementul miopiei','dincolo','de lentilă:','Managementul<br>miopiei'],
  en:['Myopia management','beyond','the lens:','Myopia<br>management'],
  ru:['Контроль миопии','за пределами','линз:','Контроль<br>миопии']
 }[lang];
 if(d)d.innerHTML=copy[0]+'<br><span class="hero-light"><span class="accent">'+copy[1]+'</span> '+copy[2]+'</span>';
 if(m)m.innerHTML='<span class="hero-bold">'+copy[3]+'</span> <span class="hero-semi"><span class="accent">'+copy[1]+'</span><br>'+copy[2]+'</span>';
 if(sub)sub.textContent=uiText('Cum educăm o generație să vadă mai bine.');
 if(go)go.textContent=uiText('ÎNSCRIE-TE LA PREZENTARE');
 if(ev)ev.textContent=uiText('SNOO · 2026 · ROMÂNIA');
}
function setLanguage(language){
 if(typeof registrationSubmitted!=='undefined'&&registrationSubmitted)return;
 const field=document.getElementById('field'),step=A[n];
 if(field&&step)S[step[3]]=field.value;
 const consent=document.getElementById('gdprConsent'),image=document.getElementById('imageConsent');
 const checked=consent&&image?[consent.checked,image.checked]:null;
 window.APP_LANG=['ro','en','ru'].includes(language)?language:'ro';document.documentElement.lang=window.APP_LANG;
 A.splice(0,A.length,...({ro:RO_STEPS,en:EN_STEPS,ru:RU_STEPS}[window.APP_LANG]).map(x=>x.slice()));
 for(const [id,lang] of [['langRo','ro'],['langEn','en'],['langRu','ru']]){const button=document.getElementById(id);if(button){button.classList.toggle('active',window.APP_LANG===lang);button.setAttribute('aria-pressed',String(window.APP_LANG===lang))}}
 if(flow.classList.contains('open')&&(field||checked||S.gdpr&&n<11)){
  render();
  if(checked){document.getElementById('gdprConsent').checked=checked[0];document.getElementById('imageConsent').checked=checked[1]}
 }
 applyHeroLanguage();translateNode(flow);
}
applyHeroLanguage();
