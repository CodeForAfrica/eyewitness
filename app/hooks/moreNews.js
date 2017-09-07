'use strict';

/*
 * HOOK: More News
 */

/*
 * Returns an array of all the articles the given user has not yet received, sorted newest first.
 */
async function getUnreceivedArticles (database, recUser, limit = 0) {

	const conditions = {
		_receivedByUsers: { $nin: [recUser._id] },
	};
	const options = {
		sort: { articleDate: `desc` },
		limit: limit || null,
	};

	const recArticles = await database.find(`Article`, conditions, options);

	return (limit ? recArticles.slice(0, limit) : recArticles);

}

/*
 * Converts the given article into a carousel element.
 */
function prepareArticleElement (recUser, recArticle) {

	return Object({
		label: recArticle.title,
		text: recArticle.description,
		imageUrl: recArticle.imageUrl,
		buttons: [{
			type: `url`,
			label: `Read`,
			payload: recArticle.articleUrl,
			sharing: true,
		}],
	});

}

/*
 * Returns the message stating there are no more news articles to read.
 */
function prepareNoArticlesMessage (MessageObject, recUser) {

	return new MessageObject({
		direction: `outgoing`,
		channelName: recUser.channel.name,
		channelUserId: recUser.channel.userId,
		text: `Whoops! There are no other news articles to read!`,
	});

}

/*
 * Returns the message containing the prepared carousel element.
 */
function prepareCarouselMessage (MessageObject, recUser, recArticles) {

	return new MessageObject({
		direction: `outgoing`,
		channelName: recUser.channel.name,
		channelUserId: recUser.channel.userId,
		text: `Here's some more news for you!`,
		carousel: {
			sharing: true,
			elements: recArticles.map(recArticle => prepareArticleElement(recUser, recArticle)),
		},
	});

}

/*
 * The hook itself.
 */
module.exports = async function moreNews (action, variables, { database, MessageObject, recUser, sendMessage }) {

	const maxArticles = 5;
	const recArticles = await getUnreceivedArticles(database, recUser, maxArticles);

	// Stop here if we have no articles to send.
	if (!recArticles || !recArticles.length) {
		const noArticlesMessage = prepareNoArticlesMessage(MessageObject, recUser);
		return await sendMessage(recUser, noArticlesMessage);
	}

	// Send the news articles.
	const message = prepareCarouselMessage(MessageObject, recUser, recArticles);
	await sendMessage(recUser, message);

};