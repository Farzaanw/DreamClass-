-- Strip legacy embedded whiteboards from classroom_designs
-- Run after cloud storage refactor migration.

update public.classroom_designs
set design_data = design_data - 'whiteboards' - 'conceptBoards'
where (design_data ? 'whiteboards')
   or (design_data ? 'conceptBoards');
