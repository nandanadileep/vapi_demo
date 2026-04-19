const OPENINGS: Record<string, string> = {
  "en-IN": `Hi, am I speaking with {{name}}? I'm Priya calling from {{clinic_name}}. I just wanted to reach out personally — no rush, no pressure — just to check in and see how we can help you.`,

  "hi-IN": `Namaste, kya main {{name}} ji se baat kar rahi hoon? Main Priya bol rahi hoon, {{clinic_name}} ki taraf se. Aapne humse contact kiya tha — main bas yeh jaanna chahti thi ki main aapki kisi bhi tarah se madad kar sakti hoon kya?`,

  "ml-IN": `Namaskaram, {{name}} aano samsaarikkunnath? Njaan Priya, {{clinic_name}}-il ninnum vilikunnu. Ningal contact cheythathu kandu — valiya budhimuttundaakkaan alla, ningalude manasil enthaanu ennu ariyaan mathramaanu vilichath.`,

  "ta-IN": `Vanakkam, {{name}} pesuraangala? Naan Priya, {{clinic_name}}-la irundhu pesuren. Neenga connect panneenga, adhan potta call panninen — enna help pannalam-nu kekkanum, adhaan.`,

  "te-IN": `Namaskaram, {{name}} gaaru maatlaadutunnaaraa? Nenu Priya, {{clinic_name}} nundi maatlaadutunnanu. Meeru contact chesaaru kaabatti call chesaanu — meeru emaina cheppukovadam unte vinadam kosam.`,

  "kn-IN": `Namaskara, {{name}} avare maatanaaduttideera? Naanu Priya, {{clinic_name}}inda kareeyuttideene. Neevu samparka madiddiri, haagaagi karedu — yenaadaru helabeku antha iddare kelabeka antha.`,
};

export default OPENINGS;
