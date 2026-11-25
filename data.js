// Exact programme data extracted from fitness_foundation_workout_plan.docx

window.FITNESS_DATA = {
  title: "Fitness Foundation Programme",
  subtitle: "3-week starting plan • Lower body, core & upper body",
  frequencyNote:
    "This is not a seven-day hard-training plan. Lower body + core is scheduled three times weekly; upper body twice weekly. Allow recovery between demanding sessions.",

  weeks: [
    {
      week: 1,
      label: "Week 1",
      startDate: "2026-11-23",
      endDate: "2026-11-29",
      dateRange: "23 Nov – 29 Nov",
      focus: "Learn the movements; use a comfortable range; prioritise controlled technique."
    },
    {
      week: 2,
      label: "Week 2",
      startDate: "2026-11-30",
      endDate: "2026-12-06",
      dateRange: "30 Nov – 6 Dec",
      focus: "Aim for steadier movement and consistent reps. Do not add load if form is not solid."
    },
    {
      week: 3,
      label: "Week 3",
      startDate: "2026-12-07",
      endDate: "2026-12-13",
      dateRange: "7 Dec – 13 Dec",
      focus: "Work towards the top of each rep range where comfortable; increase difficulty only when ready."
    }
  ],

  schedule: [
    { dayIndex: 1, short: "Mon", day: "Monday", type: "lower_core", title: "Lower body + core", notes: "Strength session", sections: ["lower", "core"] },
    { dayIndex: 2, short: "Tue", day: "Tuesday", type: "upper", title: "Upper body", notes: "Chest, shoulders, back & arms", sections: ["upper"] },
    { dayIndex: 3, short: "Wed", day: "Wednesday", type: "lower_core", title: "Lower body + core", notes: "Strength session", sections: ["lower", "core"] },
    { dayIndex: 4, short: "Thu", day: "Thursday", type: "upper", title: "Upper body", notes: "Chest, shoulders, back & arms", sections: ["upper"] },
    { dayIndex: 5, short: "Fri", day: "Friday", type: "lower_core", title: "Lower body + core", notes: "Strength session", sections: ["lower", "core"] },
    { dayIndex: 6, short: "Sat", day: "Saturday", type: "recovery", title: "Recovery / walking / mobility", notes: "Keep it light; optional easy movement", sections: [] },
    { dayIndex: 0, short: "Sun", day: "Sunday", type: "rest", title: "Rest", notes: "Full recovery", sections: [] }
  ],

  warmup: [
    { id: "wu1", text: "Easy marching or walking (3–4 min)" },
    { id: "wu2", text: "Gentle bodyweight hip hinges (10 reps)" },
    { id: "wu3", text: "Arm circles forward & backward (10 each)" },
    { id: "wu4", text: "A few easy practice repetitions of first exercise" }
  ],

  workouts: {
    lower: {
      id: "lower",
      name: "Lower Body Workout",
      badge: "Lower Body",
      exercises: [
        {
          id: "lb_1",
          num: 1,
          name: "Goblet Squat",
          sets: 3,
          targetReps: "6–8",
          defaultLogReps: "7",
          load: "8kg kettlebell",
          restLabel: "120 sec",
          restSec: 120,
          isTimed: false,
          cue: "Use a comfortable depth and keep knees tracking in line with toes. If 8kg prevents 6 controlled reps, practise bodyweight or chair squats first."
        },
        {
          id: "lb_2",
          num: 2,
          name: "Glute Bridge",
          sets: 2,
          targetReps: "12–15",
          defaultLogReps: "12",
          load: "Bodyweight",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Drive through heels and squeeze glutes at the top without over-arching the lower back."
        },
        {
          id: "lb_3",
          num: 3,
          name: "Standing Calf Raises",
          sets: 2,
          targetReps: "12–15",
          defaultLogReps: "12",
          load: "Bodyweight",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Controlled pause at the top and full stretch at the bottom."
        },
        {
          id: "lb_4",
          num: 4,
          name: "Bodyweight Hip Hinge",
          sets: 2,
          targetReps: "10–12",
          defaultLogReps: "10",
          load: "Bodyweight",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Push hips straight back with soft knees and a flat, neutral spine."
        }
      ]
    },

    core: {
      id: "core",
      name: "Core Workout",
      badge: "Core",
      exercises: [
        {
          id: "core_1",
          num: 1,
          name: "Dead Bug",
          sets: 3,
          targetReps: "8 per side",
          defaultLogReps: "8/side",
          load: "Bodyweight",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Breathe normally and keep lower back gently pressed into the floor."
        },
        {
          id: "core_2",
          num: 2,
          name: "Forearm Plank",
          sets: 3,
          targetReps: "15–25 sec",
          defaultLogReps: "20s",
          load: "Bodyweight",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: true,
          holdSec: 20,
          cue: "Breathe steadily; avoid letting the lower back sag or hips pike up."
        },
        {
          id: "core_3",
          num: 3,
          name: "Bird Dog",
          sets: 2,
          targetReps: "8 per side",
          defaultLogReps: "8/side",
          load: "Bodyweight",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Reach opposite arm and leg long while keeping hips level."
        },
        {
          id: "core_4",
          num: 4,
          name: "Modified Side Plank (bent knees)",
          sets: 2,
          targetReps: "15–20 sec per side",
          defaultLogReps: "18s/side",
          load: "Bodyweight",
          restLabel: "45–60 sec",
          restSec: 50,
          isTimed: true,
          holdSec: 18,
          cue: "Stack shoulders and hips cleanly; breathe normally."
        }
      ]
    },

    upper: {
      id: "upper",
      name: "Upper Body Workout — Chest & Arms Focus",
      badge: "Upper Body",
      exercises: [
        {
          id: "ub_1",
          num: 1,
          name: "Push-Ups",
          sets: 3,
          targetReps: "8–12",
          defaultLogReps: "10",
          load: "Bodyweight",
          restLabel: "90 sec",
          restSec: 90,
          isTimed: false,
          cue: "Maintain a rigid plank line; stop with good technique still intact."
        },
        {
          id: "ub_2",
          num: 2,
          name: "Dumbbell Floor Press",
          sets: 3,
          targetReps: "10–15",
          defaultLogReps: "12",
          load: "5kg dumbbells",
          restLabel: "90 sec",
          restSec: 90,
          isTimed: false,
          cue: "Lower elbows under control until triceps lightly touch the floor, then press."
        },
        {
          id: "ub_3",
          num: 3,
          name: "Dumbbell Lateral Raises",
          sets: 3,
          targetReps: "12–15",
          defaultLogReps: "12",
          load: "5kg or lighter if needed",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Raise with slight elbow bend to shoulder height without swinging torso."
        },
        {
          id: "ub_4",
          num: 4,
          name: "Dumbbell Shoulder Press",
          sets: 2,
          targetReps: "10–12",
          defaultLogReps: "10",
          load: "5kg dumbbells",
          restLabel: "90 sec",
          restSec: 90,
          isTimed: false,
          cue: "Brace core and press overhead without arching lower back."
        },
        {
          id: "ub_5",
          num: 5,
          name: "Supported Single-Arm Dumbbell Row",
          sets: 3,
          targetReps: "10–12 per side",
          defaultLogReps: "10/side",
          load: "5kg",
          restLabel: "60–90 sec",
          restSec: 75,
          isTimed: false,
          cue: "Pull dumbbell toward hip while keeping torso square and stable."
        },
        {
          id: "ub_6",
          num: 6,
          name: "Resistance Band Pull-Apart",
          sets: 2,
          targetReps: "12–15",
          defaultLogReps: "12",
          load: "Resistance band",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Keep shoulders down away from ears and squeeze shoulder blades together."
        },
        {
          id: "ub_7",
          num: 7,
          name: "Dumbbell Bicep Curls",
          sets: 3,
          targetReps: "10–15",
          defaultLogReps: "12",
          load: "5kg",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Keep elbows tucked at your sides; avoid swinging."
        },
        {
          id: "ub_8",
          num: 8,
          name: "Overhead Dumbbell Triceps Extension",
          sets: 2,
          targetReps: "10–12",
          defaultLogReps: "10",
          load: "One 5kg dumbbell",
          restLabel: "60 sec",
          restSec: 60,
          isTimed: false,
          cue: "Keep elbows pointing forward and lower dumbbell slowly behind head."
        }
      ]
    }
  },

  notes: [
    "Warm up for 5–8 minutes before strength sessions: easy marching or walking, gentle hip hinges, arm circles and a few easy practice repetitions.",
    "Finish each set with good technique still intact. Do not train to failure during this foundation block.",
    "For goblet squats, use a comfortable depth and keep knees tracking in line with toes. If 8kg prevents 6 controlled reps, practise bodyweight or chair squats first.",
    "For core exercises, breathe normally and avoid letting the lower back sag or arch excessively.",
    "Mild muscle soreness can occur when starting. If soreness is significant, reduce the next session or take an extra recovery day.",
    "Stop an exercise if you feel sharp pain, joint pain, dizziness or unusual symptoms. Seek medical advice for persistent or concerning symptoms.",
    "Progression is earned through control and recovery, not by forcing extra reps or adding weight on a fixed timetable.",
    "Goal: build consistent, balanced strength while supporting gradual fat loss."
  ]
};
