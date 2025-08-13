var ganttChart = new ej.gantt.Gantt({
    dataSource: [
        {
            TaskID: 1,
            TaskName: 'Planejamento da Produção',
            StartDate: new Date('10/01/2023'),
            EndDate: new Date('10/05/2023'),
            subtasks: [
                { TaskID: 2, TaskName: 'Definir cronograma de produção', StartDate: new Date('10/01/2023'), Duration: 2, Progress: 60 },
                { TaskID: 3, TaskName: 'Alocar recursos', StartDate: new Date('10/02/2023'), Duration: 2, Progress: 40 },
                { TaskID: 4, TaskName: 'Aprovação do planejamento', StartDate: new Date('10/03/2023'), Duration: 1, Progress: 30 },
            ]
        },
        {
            TaskID: 5,
            TaskName: 'Produção de Peças',
            StartDate: new Date('10/06/2023'),
            EndDate: new Date('10/15/2023'),
            subtasks: [
                { TaskID: 6, TaskName: 'Corte de matéria-prima', StartDate: new Date('10/06/2023'), Duration: 3, Progress: 50 },
                { TaskID: 7, TaskName: 'Usinagem', StartDate: new Date('10/09/2023'), Duration: 4, Progress: 40 },
                { TaskID: 8, TaskName: 'Tratamento térmico', StartDate: new Date('10/13/2023'), Duration: 2, Progress: 20 },
            ]
        },
        {
            TaskID: 9,
            TaskName: 'Montagem e Inspeção',
            StartDate: new Date('10/16/2023'),
            EndDate: new Date('10/20/2023'),
            subtasks: [
                { TaskID: 10, TaskName: 'Montagem dos componentes', StartDate: new Date('10/16/2023'), Duration: 3, Progress: 30 },
                { TaskID: 11, TaskName: 'Inspeção de qualidade', StartDate: new Date('10/19/2023'), Duration: 2, Progress: 10 },
            ]
        },
    ],
    width: '100%',
    height: '100%',
    taskFields: {
        id: 'TaskID',
        name: 'TaskName',
        startDate: 'StartDate',
        duration: 'Duration',
        progress: 'Progress',
        dependency: 'Predecessor',
        child: 'subtasks',
    },
    allowSorting: true,
    allowSelection: true,
    allowResizing: true,
    allowReordering: true,
    allowExcelExport: true,
    allowPdfExport: true,
    allowRowDragAndDrop: true,
    editSettings: {
        allowAdding: true,
        allowEditing: true,
        allowDeleting: true,
        mode: 'Dialog'
    },
    toolbar: ['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll', 'ExcelExport', 'PdfExport', 'Search', 'ZoomIn', 'ZoomOut', 'ZoomToFit'],
    highlightWeekends: true,
    timelineSettings: {
        timelineUnitSize: 50,
        topTier: {
            unit: 'Week',
            format: 'MMM dd, yyyy'
        },
        bottomTier: {
            unit: 'Day',
            format: 'd'
        }
    },
    columns: [
        { field: 'TaskID', headerText: 'ID', width: 60, textAlign: 'Right' },
        { field: 'TaskName', headerText: 'Nome da Tarefa', width: 250 },
        { field: 'StartDate', headerText: 'Data de Início', width: 120, format: 'dd/MM/yyyy', textAlign: 'Right' },
        { field: 'Duration', headerText: 'Duração', width: 100, textAlign: 'Right' },
        { field: 'Progress', headerText: 'Progresso', width: 100, textAlign: 'Right' }
    ],
    labelSettings: {
        leftLabel: 'TaskName',
        rightLabel: 'Progress'
    },
    splitterSettings: {
        columnIndex: 2
    },
    projectStartDate: new Date('09/28/2023'),
    projectEndDate: new Date('10/25/2023'),
    zoomSettings: {
        enable: true,
        zoomIn: true,
        zoomOut: true,
        zoomToFit: true
    },
    rowDrop: function (args) {
        console.log('Row dropped:', args);
        if (!args.dropIndex) {
            // Create a new task if dropped in an empty area
            var newTask = {
                TaskID: ganttChart.dataSource.length + 1,
                TaskName: 'Nova Tarefa',
                StartDate: new Date(),
                Duration: 1,
                Progress: 0
            };
            ganttChart.addRecord(newTask, null, 'Child');
        }
    }
});

// Helper functions for auto-creating new rows
function getNextTaskID() {
    var maxId = 0;
    function findMaxId(data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].TaskID > maxId) {
                maxId = data[i].TaskID;
            }
            if (data[i].subtasks && data[i].subtasks.length > 0) {
                findMaxId(data[i].subtasks);
            }
        }
    }
    findMaxId(ganttChart.dataSource);
    return maxId + 1;
}

function createNewEmptyTask() {
    // Find the latest end date from all tasks
    var latestEndDate = getLatestTaskEndDate();

    // Calculate start date for new task (one day after the latest end date)
    var newStartDate = new Date(latestEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    var newTask = {
        TaskID: getNextTaskID(),
        TaskName: 'Nova Tarefa',
        StartDate: newStartDate,
        Duration: 1,
        Progress: 0
    };

    // Add the new task at the end as a top-level task
    ganttChart.addRecord(newTask);

    // Auto-select the new row
    setTimeout(function() {
        var newRowIndex = ganttChart.flatData.length - 1;
        ganttChart.selectRow(newRowIndex);
    }, 100);
}

function checkAndCreateNewRow(rowIndex) {
    var totalRows = ganttChart.flatData.length;

    // If selecting the last row, prepare to create a new one
    if (rowIndex >= totalRows - 1) {
        // Add a small delay to allow for navigation completion
        setTimeout(function() {
            var selectedIndex = ganttChart.selectedRowIndex;
            if (selectedIndex >= totalRows - 1) {
                createNewEmptyTask();
            }
        }, 300);
    }
}

// Handle keyboard navigation for creating new rows
document.addEventListener('keydown', function(event) {
    if (ganttChart && ganttChart.element) {
        var selectedRowIndex = ganttChart.selectedRowIndex;
        var totalRows = ganttChart.flatData.length;

        // Check if we're in the Gantt component
        if (document.activeElement && ganttChart.element.contains(document.activeElement)) {
            // Arrow Down key
            if (event.key === 'ArrowDown' && selectedRowIndex >= totalRows - 1) {
                event.preventDefault();
                createNewEmptyTask();
            }
            // Tab key (when not in edit mode)
            else if (event.key === 'Tab' && selectedRowIndex >= totalRows - 1 && !ganttChart.isEdit) {
                event.preventDefault();
                createNewEmptyTask();
            }
        }
    }
});

ganttChart.appendTo('#Gantt');
