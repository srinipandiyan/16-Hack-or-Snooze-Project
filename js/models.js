"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).host;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(currentUser, {title, author, url}) {
    //make an axios post request with token and story
    const response = await axios ({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: {
        token: currentUser.loginToken, 
        story: {title, author, url}
      },
    });

    //new instance of story class
    const story = new Story(response.data.story);
    //adds story to beginning of array
    this.stories.unshift(story);
    currentUser.ownStories.unshift(story);
    //returns story
    return story;
  }

  async removeStory(currentUser, storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: currentUser.loginToken }
    });

    // Get story by ID for removal using filter
    this.stories = this.stories.filter(story => story.storyId !== storyId);

    // Get story by id among user favorites and associated stories.
    currentUser.ownStories = currentUser.ownStories.filter(s => s.storyId !== storyId);
    currentUser.favorites = currentUser.favorites.filter(s => s.storyId !== storyId);
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

/** Add a story to user favorites and update API*/
async addUserFavorite(story){
  await axios({
    url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
    method: "POST",
    data: {token: this.loginToken},
  });
  this.favorites.push(story);
}

/** Remove a story from user favorites and update API*/
async removeUserFavorite(story){
  await axios({
    url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
    method: "DELETE",
    data: {token: this.loginToken},
  });
  this.favorites = this.favorites.filter(val => val.storyId !== story.storyId);
}

isFavorite(story) {
  return this.favorites.some(val => val.storyId === story.storyId);
}
}

/**Implement Infinite (not actually infinite as there aren't enough stories) Scroll

//Initialize variables to keep track of the current page and the stories to load per page
let allStoriesPage = 1;
let storiesPerPage = 25;

function loadMoreStories() {
  console.debug("loadMoreStories");

  //Calculate the range of stories to load based on the current page
  const startIndex = (allStoriesPage - 1) * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;

  //Constructor should store all stories in StoryList object--otherwise, we could implement this.
  for (let i = startIndex; i < endIndex && i < storyList.stories.length; i++) {
    const $story = generateStoryMarkup(storyList.stories[i]);
    $allStoriesList.append($story);
  }
  //Increment the current page
  allStoriesPage++;
}

//Event listener for scroll
window.addEventListener("scroll", () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  //Check if the user has scrolled to the bottom
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    loadMoreStories();
  }
});  */