# SDLC Office

A small office where the people of the sdlc plugin work at their desks. Anyone who needs you lines up outside your door.

## Start it

1. Double-click **Start Office**. A window opens, then your browser opens the office.
2. Keep that window open. Closing it closes the office and stops every session.

The first time, drag a project folder onto **Start Office**. Doing that later adds another folder and opens it.

It needs Node.js, Claude Code, the sdlc plugin and the GitHub tool. To let the team look at screens in a browser, also run `npm ci` once in the browser-tool folder; it uses your installed Chrome. Without it the office runs the same, with no browser tool.

## Projects

The file cabinet in your office holds a drawer for each project, listed in projects.json in this folder. Pick a drawer to switch. Sessions keep running when you switch, and the top right shows how many people wait in your other projects. Each session can only touch its own project automatically; anything else waits for your click.

To add a drawer, type owner/repo in the cabinet and press Add drawer. If that project is on GitHub, it is copied into a projects folder beside the office folder. If it is not, the cabinet says so and gives you the setup command to copy.

## Use it

- Walk with the arrow keys, or click anyone on the small map.
- **Give a job:** talk to someone, pick Give a job, type it, press Give the job.
- **Next:** calls in the next person in line. Each one shows you a reply, a question, an approval, or finished work.
- **Reply:** type an answer, or press Back to work to send nothing.
- **Approve or Deny:** routine actions run on their own. Anything else, such as sending work to GitHub or deleting something, waits for your click. It waits as long as you need and never goes ahead by itself.
- **Accept:** only sent when you click it.
- **End this session:** everyone can work at once, and each person working uses your Claude usage. End a session when that person is done.
- **Your office:** the red alarm stops work, the time clock picks stopped work back up, the elevator hands work off, and the rubber stamp on your desk accepts a whole job. The threshold dial sets what comes to you and what the team decides; it is one setting for all your projects.
- **Conference room:** the blueprint table runs setup with the CEO. **Review Room:** runs expert review with the Architect, and you can set how many reviewers and rounds. These work in the current project.
- **Ticket board:** shows everything in the project: its GitHub project board if it has one, every issue and pull request, and job tasks with no ticket. Click a ticket for its details.
- **Settings:** your level, the mentor, what comes to you, what counts as yours, where legal work applies, team size and standing orders.
- **On a card:** Open links show a file in another browser tab. Full explanation shows the words before they were put at your level.
- **Close Office:** anyone with work going finishes their current step and saves their place, then the office closes, within about 2 minutes. **Close now** skips the wait, so work could stop in the middle of a step. Closing the black window also stops at once.
- **Paused work:** next time, those people wait in line. Nothing runs until you press **Continue** or **Continue everyone**. **End for good** drops the saved session and does not delete any project files.
- **Copy boxes:** the office sends everything itself. A command to copy appears only when it cannot deliver something, such as when no saved session exists for a job or a session could not be reopened, and the card says why.
- **Saved sessions:** sessions.json in this folder remembers who was working. Talking to someone with a saved session reopens it, so they remember the earlier work. Waiting approvals are not saved; the person asks again if they still need it.

## What it does not do yet

- Nothing carries on in the background once the office is closed.

## If something goes wrong

- **The page says not connected:** double-click Start Office again and use the tab it opens.
- **The window says the port is in use:** the office is probably already open in another window. Close that one first.

Every automatic action and every decision you make is listed in office-log.txt in this folder.
