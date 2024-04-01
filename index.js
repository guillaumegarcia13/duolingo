// Global variables (set after setup step)
var headers;
var sub;
var fromLanguage,
    learningLanguage;

var totalXP = 0;

// Setup
const setup = async () => {
	process.env.LESSONS = process.env.LESSONS ?? 1;

	headers = {
		"Content-Type": "application/json",
		Authorization : `Bearer ${process.env.DUOLINGO_JWT}`,
		"user-agent"  : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
	};

	({sub} = JSON.parse(Buffer.from(process.env.DUOLINGO_JWT.split(".")[1], "base64").toString()));

	({ fromLanguage, learningLanguage } = await fetch(
		`https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage`,
		{
			headers,
		}
	).then((response) => response.json()));
};

// Runs a single session
const runSession = async () => {
	const session = await fetch(
		"https://www.duolingo.com/2017-06-30/sessions",
		{
			body: JSON.stringify({
				challengeTypes: [
					"assist",
					"characterIntro",
					"characterMatch",
					"characterPuzzle",
					"characterSelect",
					"characterTrace",
					"characterWrite",
					"completeReverseTranslation",
					"definition",
					"dialogue",
					"extendedMatch",
					"extendedListenMatch",
					"form",
					"freeResponse",
					"gapFill",
					"judge",
					"listen",
					"listenComplete",
					"listenMatch",
					"match",
					"name",
					"listenComprehension",
					"listenIsolation",
					"listenSpeak",
					"listenTap",
					"orderTapComplete",
					"partialListen",
					"partialReverseTranslate",
					"patternTapComplete",
					"radioBinary",
					"radioImageSelect",
					"radioListenMatch",
					"radioListenRecognize",
					"radioSelect",
					"readComprehension",
					"reverseAssist",
					"sameDifferent",
					"select",
					"selectPronunciation",
					"selectTranscription",
					"svgPuzzle",
					"syllableTap",
					"syllableListenTap",
					"speak",
					"tapCloze",
					"tapClozeTable",
					"tapComplete",
					"tapCompleteTable",
					"tapDescribe",
					"translate",
					"transliterate",
					"transliterationAssist",
					"typeCloze",
					"typeClozeTable",
					"typeComplete",
					"typeCompleteTable",
					"writeComprehension",
				],
				fromLanguage,
				isFinalLevel: false,
				isV2: true,
				juicy: true,
				learningLanguage,
				smartTipsVersion: 2,
				type: "GLOBAL_PRACTICE",
			}),
			headers,
			method: "POST",
		},
	)
	.then((response) => response.json());

	const response = await fetch(
		`https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
		{
			body: JSON.stringify({
				...session,
				heartsLeft: 0,
				startTime: (+new Date() - 60000) / 1000,
				enableBonusPoints: false,
				endTime: +new Date() / 1000,
				failed: false,
				maxInLessonStreak: 9,
				shouldLearnThings: true,
			}),
			headers,
			method: "PUT",
		},
	)
	.then((response) => response.json())
	// .then((json) => console.log(json))
	;

	return {
		session: session, 
		xpGain : response.xpGain,
	};
};

(async function() {
	await setup();

	for (let i=0 ; i<process.env.LESSONS ; i++) {
		try {
			let {
				session,
				xpGain,
			} = await runSession();

			totalXP += xpGain;

			console.log(`    you gained ${ xpGain } XP on session '${ session.id }' from ${  fromLanguage } to ${ learningLanguage }`);
		}
		catch (error) {
			console.log(`❌ Something went wrong`);

			if (error instanceof Error) { console.error(error.message); }
		}	
	}

	console.log(`🎉 You won ${ totalXP } XP`);
})();