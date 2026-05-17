What's been chcked:
1) Two accounts made & validated on these components
- Data is kept seperate
- Data is kept in the right places (metadata in Postgres, files in Storage)
- Classroom designs saved
- Classroom material saved
- Edits to default whtiteboard saved
- New Subjects added saved
- Deleted Subjects deleted
- Calender info is saved
- Most data properly saved upon log out


Still Need Better Checks:
- Whiteboard state saving in history tab
- Login -> logout -> login: check that whiteboard states are still accessbile via the history tab
- Drag all types of items onto whiteboard, check that they save correctly and are visible in the history tab
- Check that the new storage schema is working for all material types (images, PDFs, etc.) and that thumbnails are generated correctly.
- Not working: when materials uploaded under user are deleted, deletion doesn't reflect in the `material_assets` table, and the file still exists in Storage. Need to check that deletions are fully implemented and tested.
- Test edits on subject material tabs are refelected
- Songs library / Game library not touched yet

