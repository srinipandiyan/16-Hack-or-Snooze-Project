"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

/** Create Story markup function */
function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  //if logged in, show favorites icon.
  const showFavorite = Boolean(currentUser)
  return $(`
      <li id="${story.storyId}">
      <div>
      ${showDeleteBtn ? deleteBtn() : ""}
      ${showFavorite ? starBtn(currentUser, story) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        </div>
      </li>
    `);
}

/** Insert HTML btns */

function deleteBtn() {
  return `
  <span class="trash-can">
    <i class="fas fa-trash alt"></i>
  </span>`;
}
function starBtn(user, story) {
  const isFavorite = user.isFavorite(story);
  const toggleStar = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${toggleStar} fa-star"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Submit new story form within nav bar */

async function handleNewStory(evt){
  console.debug("handleNewStory");
  evt.preventDefault();

  // Get the form data
  const author = $("#story-author").val();
  const title = $("#story-title").val();
  const url = $("#story-url").val();

  const username = currentUser.username
  const storyData = { title, author, url, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // hide submit form and reset it
  $storyForm.slideUp("slow");
  $storyForm.trigger("reset");
}

$storyForm.on("submit", handleNewStory);

/** Load user favorited stories */

function loadFavoritesList() {

  console.debug("loadFavoritesList");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>Wow, such emptyness. Add to favorites now!</h5>");
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

/** Handle favorite/un-favorite a story */

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // see if the item is already favorited (checking by presence of star)
  if ($tgt.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeUserFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addUserFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);

/** Load User submitted stories */

function loadUserStories() {
  console.debug("loadUserStories");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>Wow, such emptyness. Add a story!</h5>");
    } else {
    // loop through all of users stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

/** Handle deleting a story. */

async function deleteStory(evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);
  
  await loadUserStories();
}

$ownStories.on("click", ".trash-can", deleteStory);