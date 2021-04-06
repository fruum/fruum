# Manage categories as administrator

Fruum category is a helping element to categorize your main content.

Categories can be created within other categories (much like folders) and not inside an article, thread or channel. To add a new category click the "category" button at the bottom of fruum.

Displayed fields are the category title, a description and a category avatar used as visual aid.

Also the purpose of the category is defined that affects the content that can be hosted inside a category using the use for field with the following options:

- Discussion, the classic threaded forum
- Helpdesk, used to host help articles or documentation
- Blog, used for blogging articles
- Chat, used as container to create chat channels
- Categories only, acting as a placeholder for sub-categories

The visible to field defines the permission of the category and its children and can be one of:

- Everyone, to allow even anonymous users to see the content
- Logged-in users, accessible only to authenticated users
- Administrators, for private stuff

> A "Home" category is automatically created to host all your content. This category is also fully manageable by fruum administrators.

# Add an article/blog as adminstrator

An article or blog allows you to write more persistent content and keeps focus on your initial content.

Administrators can add articles or blog by clicking on the "article" or "blog" buttons respectively.

Articles and blogs are sortable and are displayed in a different section than threads.

Adminstrators can manage an article or blog:

- In the article list by clicking a gear icon on the right of the article, to edit, sort the article or delete it.
- While viewing the article clicking the gear icon on the right of the article's title, to edit, make the article private, allow/block posts under the article or delete it.

# Add a thread

Thread are the basic communication streams in fruum.

To add a thread click on the "thread" button.

> If you can not find this button this means that no new threads are allowed in the selected category.

After creating a new thread it will be visible in the threads list. Threads are automatically sorted chronologically based on the posts and content activity inside each thread.

The person that created the thread can manage it:

- via the threads list, by clicking the gear icon on the right of the thread title, to edit it. In case the thread creator is an admin an additional options to pin and delete the thread are available.
- for administrator created threads, inside the thread clicking the gear icon on the thread title. The administrator can edit, turn private, disable posts or delete the thread.

# Add a channel

A channel is a real-time communication stream, a chat.
Fruum channels are updated in real-time. While channel lists are visible a badge with a counter for new messages is updated in real-time.

To add a channel click at the "channel" button.

The channel creator can edit the title through the channel list by clicking the edit icon on the right of the channel.

An administrator creating a channel can have more options:

- in the channel list by clicking the gear icon on the right an adminstration can edit the name or delete the channel
- when inside the channel stream clicking the gear icon on the right of the channel title actions for editing, turning the channel private or delete it

# Attaching images

You can attach images in your posts by using the camera icon on the footer. PNG and JPEG images are supported.

Pressing it will reveal a popup where you can:

- Click the + icon to add one or multiple images from your hard drive
- Drag and Drop an image file inside the popup
- Paste an image from clipboard (Chrome only)
file0

After that, a shortcut to your image will be added in the text input in the form of

`[[image:<filename>]]`

and you can move it to the appropriate place.

> TIP: You can use preview mode to see how your images look like.

Note that large images will be downscaled to a max of 800x800 pixels.

# Move streams between categories

When you maintain a fruum with multiple categories, it is often useful to move threads, articles or channels around. For example, a user may create a thread that its content applies better to another category. The moderator should be able to do that.

Moving things around requires administrator permissions. On the list of articles, threads or channels you can find a "move" symbol (like <) inside the gear icon. Clicking it will reveal a popup of categories that you can move the selected stream into.

# Copy a link, watch a thread, report and manage a post

## Copy a link

All fruum categories, articles, threads, channels can be shared by clicking the copy link anchor under their name.

If you are not sure of how that works try clicking the copy link on the title of this article.

> Pasting this link to a new tab or window will load the main page and fruum will open showing the copied link content

## Watch a stream

Logged in users may mark for watch an article or thread. This is a link next to the copy link icon right below the title of the stream.
Watching a stream, you get notifications on any updated or added content in that stream.

> If you are the creator of the stream or you reply to another's user stream, you are automatically set to watch that stream.

## Report and manage a post

Logged in users can edit their own threads, articles and messages by clicking an edit icon on the top right corner of their message.
A logged in user can report any reply, thread or article by clicking a flag icon at the bottom of the certain message.

Administrators are informed about reports and can take an action from the same area by locking the reported message.

# Searching (like a boss)

Fruum is empowered by elasticsearch, so search should be awesome.

To search hit the search icon on the top and enter a string. You can search inside:

- Threads and replies
- Articles and comments
- Blogs and comments

e.g. "api"

You can search for tags using the #tag format, e.g. "#bug #fixed"

and for users using the @username, e.g. @johnsnow

More advanced search options:

- Search in parent category: parent:slug
- Disable word highlighting: highlight:0
- Set max results: maxresults:number
- Search by content type: type:thread|article|blog|post
- Sort by creation date: sort:created|created_asc
- Sort by update date: sort:updated|updated_asc
- Sort by username: sort:user|user_asc

# Storing search results

Administrators can bookmark search queries using stored searches.

An example use case is filtering out threads or articles than contain a special tag, e.g. #bug.

To create a stored search, hit the search icon, perform a search and on the bottom a "Store Search" button will appear. Click it, then enter the name of the stored search and select the parent category.

> Important: You cannot edit the search query of a stored search. You will need to delete it and create it again.

# Best practices setting up your streams

## Quick overview

Fruum comes with a handful of options to setup communication streams with a userbase. The available communication streams are:

- Articles, like more persistent threads focusing on the first post (like a blogpost)
- Threads, and
- Channels, where users can chat in real-time

To organize those streams there is a category item where similar streams can be grouped together.

Managing those four elements and the possible options for customizing the we present some possible setup scenarios.

## Scenario 1: Setup a default forum under a category

1. **Create the category**. Giving a proper name and description are important, also pay attention to category's avatar and letters used for the avatar.
2. **Manage category actions**. After creating the category setup the possible actions within the category by clicking the gear icon on the avatar of the category. Allow only new threads, thus disabling creation of new channels in the category.
3. **Administer your thread category**, by monitoring created threads and pinning important threads. Users have the ability to report a post so as an administrator keep an eye for notification emails to manage incoming reports. An administrator could also make a category private so that only logged in users have access to it.

## Scenario 2: Setup a single channel for real-time chat in a category

1. As an administrator visit the category and check for the add channel button. If there is no add channel button it means that this category does not allow channel creation. In that case manage category actions and enable channel creation.
2. Click the add channel button while in the category, again give a descriptive channel name.
3. After creating the channel, disable channel creation from the manage category actions.

## Scenario 3: Setup an articles-only category ( Documentation and admin curated content only )

1. Create the category, try to be descriptive on the name and description and pay attention to avatar colors and letters.
2. Manage category actions and disable both new threads and new channels creation. Now only administrators can add articles to this category
3. Allow/disallow posts for each article according to category's specific needs.
4. Curate articles by sorting them according to importance

## To sum up

Fruum allows for many customizations. Above are some representative setups that by no means are the only ones available. Adjust fruum to specific use cases based on each category's actions setup and your selected streams allowed actions (private, pin, allow/disallow posts).

When all options are available within a category the elements are organized in a specific order:

1. Categories list (sortable)
2. Articles list (sortable)
3. Threads list (recently updated first)
3. Channels list (recently updated first)

## Reputation system (karma)

Fruum incorporates a reputation system using karma points.

Active users are rewarded with positive karma and users who get moderated for inappropriate content get negative karma.

Karma points are distributed in the following way:

- New topic (thread, article or blog) gives you +2 karma points
- Getting a reply on a thread you created gives you +2 karma points
- Replying on a topic gives you +1 karma point
- Getting a thumbs up reaction on a post gives you +10 karma points
- Getting a thumbs down reaction on a post gives you -1 karma point
- Getting flagged for inappropriate content by a moderator gives you -50 karma points

You can see your karma by clicking your user avatar on the top-right corner. Also, if you are online, you get karma notifications next to the avatar icon.

> Developers can change the point distribution on config.json under the karma section.
