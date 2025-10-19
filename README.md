# frontend
# SiPanit – Interactive Event Layout and Seating Manager

## Team Information
- **Team Name:** Six Syntax  
- **Course Code:** DECO3801 – Design Computing Studio 3 – Build
- **Project Preferences:** 28B: Interactive Event Layout and Seating Manager
- **Project Begin Date:** Week 5 DECO Studio (25/08/2025)  

## Project Description
**SiPanit** – a name derived from Bahasa Indonesia, short for *"Si Panitia"* which means *"the committee person"*.  
Our app is built to be that reliable hand behind the scenes, helping planners organise layouts, vendors prepare with accurate seating info, and guests easily find their place.

## Team Members
| Name                     | Student Number |
|--------------------------|----------------|
| Ahmad Danindra Nugroho   | 48786847       |
| Andika Pramudya Wardana  | 49058895       |
| Ardhika Satria Narendra  | 49062717       |
| Arya Fakhruddin Chandra  | 47667190       |
| Muhammad Fiqo Anugrah    | 48298975       |
| Teuku Auli Azhar         | 48876823       |

---

## Tech Stack
- **Frontend:** Next.js 14, React, Tailwind CSS, Framer Motion  
- **Backend / API:** Node.js (Express) + Supabase / REST integration  
- **Testing:** Jest, React Testing Library  
- **Version Control:** Git + GitHub  

---

## Project Structure

```
frontend/
├─ public/                # static assets (logo, icons, etc.)
├─ src/
│  ├─ api/                # API wrappers (auth, interviews, applicants, etc.)
│  ├─ components/         # Reusable UI components (Button, Input, etc.)
│  ├─ pages/              # Next.js pages (SignIn, SignUp, Dashboard, etc.)
│  ├─ services/           # Business logic (AuthService, analytics, etc.)
│  ├─ tests/              # Unit + integration tests
│  └─ utils/              # Helper functions & utilities
```

---

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd frontend
```

### 2. Install dependencies
```bash
npm install
# atau
yarn install
```

### 3. Run the development server
```bash
npm run dev
```

App will be available at **http://localhost:3000**

## Testing

### Run all tests
```bash
npm run test
```

### Run tests with coverage
```bash
npm run test -- --coverage
```

⚠️ For now, coverage threshold is disabled so all tests can pass without coverage errors.

## Contribution Workflow
1. **Branching:** Use `feature/<feature-name>` for new features.
2. **Commits:** Keep them small and descriptive, e.g., `fix: update SignIn button handler`.
3. **Pull Requests:** Before merging to `main`, ensure lint & tests pass.

## License
This project is developed for **DECO3801 (UQ)** course and intended for academic purposes.

# User Testing Documentation

## Overview
So we built this event management app called SiPanit, and obviously we needed real humans to break it for us. Here's what happened when we let people loose on our baby.

## Testing Methodology

### Who We Tested With
- **Total Participants:** 12 people
- **Demographics:** Mix of event planners (3), regular people who organize parties (5), and random friends who had nothing better to do (4)
- **Age Range:** 22-45 years old
- **Tech Savviness:** Varies from "I can barely use Instagram" to "I code for a living"

### What We Asked Them To Do
We gave participants these scenarios and basically said "go wild":

1. **Sign up and create your first event**
2. **Set up a basic seating layout**
3. **Add some guests and assign seats**
4. **Try to find your way around the app**
5. **Break something (intentionally or not)**

## Testing Sessions

### Session Format
- **Duration:** 45-60 minutes per person
- **Setting:** Mix of in-person and remote (Zoom screen share)
- **Recording:** With permission, because we're not monsters
- **Think-aloud protocol:** Asked users to verbalize their thoughts while clicking around

### Sample Interview
**Participant:** rapip, 28, Marketing Coordinator who organizes company events

**Interviewer:** So we're going to have you try out our event management app. Just do whatever feels natural and tell us what you're thinking as you go.

**rapip:** Okay, cool. So I'm on the homepage... it looks pretty clean. I like the colors.

**Interviewer:** What would you expect to do first?

**rapip:** Probably sign up? I see the "Get Started" button. *clicks* Oh, this is a sign-up form. Pretty standard... name, email, password. *filling out form* 

**Interviewer:** How's the sign-up process feeling?

**rapip:** It's fine, nothing crazy. Oh wait, it's asking for "organization type" - I'm not sure if my company counts as "corporate" or "small business." Maybe add some examples here? *selects corporate* 

**Interviewer:** What happens next?

**rapip:** *clicks submit* Okay it's loading... still loading... is it supposed to take this long? Oh there we go. Now I'm in some kind of dashboard. *pause* I'm not really sure what to do next though.

**Interviewer:** What would you naturally want to do?

**rapip:** Create an event, I guess? I see "New Event" up here. *clicks* This form is pretty long... title, date, venue, description. Do I have to fill all of this out now? *scrolls down* Oh wow, there's a lot more fields. This feels overwhelming.

**Interviewer:** How would you prefer this to work?

**rapip:** Maybe just start with the basics? Like title and date, then let me add details later. I don't always know the venue when I'm first planning something.

**Interviewer:** Let's say you fill it out and create the event.

**rapip:** *fills form* Okay, creating event... *waits* Nice, now I'm in the event dashboard. This is better - I can see sections for guests, seating, catering. Makes sense. Let me try adding some guests. *clicks "Manage Guests"*

**Interviewer:** How's the guest management?

**rapip:** It's asking me to add guests one by one? That's going to take forever for a 50-person event. Is there a way to import a list? *looks around* I don't see one. This would be a dealbreaker for me honestly.

**Interviewer:** What about the seating layout feature?

**rapip:** *clicks on seating* Whoa, this is actually pretty cool. I can drag tables around... *drags a table* That's satisfying. And I can change the table shape - round, rectangular. This is way better than drawing it on paper like I usually do.

**Interviewer:** Try assigning some seats.

**rapip:** *clicks on a chair* Oh, it opens a dropdown with my guests. That's intuitive. *assigns a few people* Wait, I just accidentally put John at the wrong table. How do I undo that? *clicks around* I don't see an undo button. If I mess up a big seating arrangement, do I have to start over?

**Interviewer:** Any other thoughts as you explore?

**rapip:** The visual stuff is really nice, but it feels like it's missing some practical features. Like, I need to be able to import guest lists, export seating charts to share with the venue, maybe integrate with our calendar system. The foundation is solid though.

**Interviewer:** Would you use this for your next event?

**rapip:** Honestly? I'd probably stick with my current process for now. But if you fixed the guest import thing and added an undo feature, I'd definitely give it another shot. The seating visualization alone would save me hours.

### What We Measured
- **Task completion rate** - Did they actually finish what we asked?
- **Time to complete tasks** - How long did it take?
- **Error frequency** - How many times did they mess up (or we messed up)?
- **User satisfaction** - Did they want to throw their laptop out the window?

## Key Findings

### The Good Stuff
- **Intuitive navigation:** Most users figured out the main flow pretty quickly
- **Visual feedback:** People loved the drag-and-drop seating interface
- **Clean design:** Multiple comments about it "looking professional"
- **Mobile responsiveness:** Worked well on phones, which was a relief

### The Not-So-Good Stuff
- **Onboarding confusion:** 60% of users got lost during initial setup
- **Form validation:** Error messages were either too vague or too aggressive
- **Loading states:** People thought the app crashed when it was just thinking
- **Guest management:** Adding multiple guests felt tedious

### The Ugly Truth
- **Search functionality:** Barely functional, users hated it
- **Undo operations:** No way to undo seat assignments (whoops)
- **Export features:** PDF generation was broken for complex layouts
- **Performance:** Slow with 100+ guests, basically unusable with 500+

## Specific Issues Found

### Critical Issues
1. **Data loss bug:** If users refreshed during event creation, everything vanished
2. **Mobile layout breaking:** Seating editor completely broken on screens < 768px
3. **Authentication loops:** Some users got stuck in infinite login redirects

### Medium Priority Issues
1. **Inconsistent button styles:** Confusion about what's clickable
2. **Missing confirmation dialogs:** Users accidentally deleted events
3. **Unclear icon meanings:** What does that symbol even mean?

### Minor Issues
1. **Typos in error messages:** "Someting went wrong" - classic
2. **Color contrast:** Accessibility issues with light gray text
3. **Missing tooltips:** Users hovering expecting help that never came

## User Quotes
*Because nothing beats real feedback:*

> "I love how clean it looks, but I have no idea what I'm supposed to do next."
> - Participant #3

> "The drag-and-drop is satisfying, but I accidentally deleted my whole seating chart and wanted to cry."
> - Participant #7

> "This is way better than Excel, but that's not saying much."
> - Participant #11

> "Can I just say the loading spinner is really pretty? That's important, right?"
> - Participant #4

## Recommendations

### Immediate Fixes
- **Add proper loading states** everywhere
- **Implement undo/redo** for seating operations
- **Fix the mobile seating editor** completely
- **Add confirmation dialogs** for destructive actions

### Short-term Improvements
- **Redesign onboarding flow** with guided tour
- **Improve form validation** with helpful messages
- **Add bulk guest import** functionality
- **Optimize performance** for large events

### Long-term Considerations
- **Advanced search filters** for guests and events
- **Real-time collaboration** features
- **Integration with calendar apps**
- **Analytics dashboard** for event insights

## Lessons Learned

### What Worked
- **Incremental testing:** Testing early prototypes saved us from bigger disasters
- **Diverse user base:** Different perspectives caught different issues
- **Think-aloud protocol:** Hearing user thoughts in real-time was invaluable

### What We'd Do Differently
- **Test earlier:** Some issues could've been caught in wireframe stage
- **Longer sessions:** 45 minutes wasn't enough for complex scenarios
- **More realistic data:** Testing with 5 guests doesn't reveal performance issues
- **Post-session interviews:** Should've followed up a week later

## Next Steps

### Immediate Actions
1. Fix critical bugs before next release
2. Implement top 5 user-requested features
3. Run another round of testing with fixes
4. Update documentation based on user confusion points

### Future Testing Plans
- **A/B testing:** For controversial design decisions
- **Accessibility testing:** With users who have disabilities
- **Load testing:** With realistic event sizes
- **Longitudinal study:** How do users adapt over time?

## Conclusion

Users generally like the concept and design, but we've got some work to do on the execution. The app shows promise, but it's definitely not ready for prime time yet. 

The good news? Most issues are fixable, and users are willing to be patient with us. The bad news? We probably should've caught some of these earlier.

Overall, this testing round was humbling but super valuable. Nothing beats watching real people use your app to find out where you went wrong.

---

*Testing conducted: September 2025*  
*Next testing round scheduled: October 2025*