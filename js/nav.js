"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
  $storiesContainer.hide()
}

$navLogin.on("click", navLoginClick);


function navProfileClick(evt) {
  console.debug("navProfileClick", evt);
  hidePageComponents();
  $userProfile.show();
}

$navUserProfile.on("click", navProfileClick);
/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

/** show new story form after clicking submit on nav bar*/

/**function navNewStoryFormClick(evt){
  console.debug("navNewStoryFormClick", evt);
  evt.preventDefault();
  $("#new-story-form").show();
}
$("#nav-submit-story").on("click", navNewStoryFormClick);
 */

function navSubmitStoryClick(evt) {
  console.debug("navSubmitStoryClick", evt);
  hidePageComponents();
  $allStoriesList.show();
  $storyForm.show();
}

$navSubmitStory.on("click", navSubmitStoryClick);

/**Display user favorites when clicking "my favorites" */

function navFavoritesClick(evt) {
  console.debug("navFavoritesClick", evt);
  hidePageComponents();
  loadFavoritesList();
}

$body.on("click", "#nav-favorites", navFavoritesClick);

/** Display user stories on clicking "my stories" */

function navMyStoriesClick(evt) {
  console.debug("navMyStoriesClick", evt);
  hidePageComponents();
  loadUserStories();
  $ownStories.show();
}

$body.on("click", "#nav-my-stories", navMyStoriesClick);
