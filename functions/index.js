// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { onSchedule } = require("firebase-functions/v2/scheduler");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const axios = require("axios");

const app = initializeApp();
const db = getFirestore(app);

const options1 = {
  method: "POST",
  url: "https://leetcode.com/graphql",
  headers: {
    "Content-Type": "application/json",
  },
  data: {
    query: `query questionOfToday {
      activeDailyCodingChallengeQuestion {
        date
        userStatus
        link
        question {
          acRate
          difficulty
          freqBar
          frontendQuestionId: questionFrontendId
          isFavor
          paidOnly: isPaidOnly
          status
          title
          titleSlug
          hasVideoSolution
          hasSolution
          topicTags {
            name
            id
            slug
          }
        }
      }
    }`,
  },
};

const options2 = (titleSlug) => {
  return {
    method: "POST",
    url: "https://leetcode.com/graphql",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      query: `query questionContent($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          content
          mysqlSchemas
        }
      }`,
      variables: {
        titleSlug: titleSlug,
      },
    },
  };
};

exports.scheduledGraphQLRequest = onSchedule("every day 00:00", async () => {
  try {
    const res = await axios.request(options1);
    const question = res.data.data.activeDailyCodingChallengeQuestion.question;
    const response = await axios.request(options2(question.titleSlug));
    const questionContent = response.data.data.question.content;
    await db.collection("questions").add({
      id: question.titleSlug,
      title: question.title,
      categories: question.topicTags.map((e, _) => e.name),
      difficulty: question.difficulty,
      description: questionContent,
    });
  } catch (e) {
    console.error(e);
  }
});
