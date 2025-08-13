var ganttChart = new ej.gantt.Gantt({
    dataSource: [
        {
            TaskID: 1,
            TaskName: 'Planejamento e Design do Veículo',
            StartDate: new Date('08/01/2025'),
            EndDate: new Date('08/05/2025'),
            subtasks: [
                { TaskID: 2, TaskName: 'Análise de requisitos técnicos', StartDate: new Date('08/01/2025'), Duration: 2, Progress: 80 },
                { TaskID: 3, TaskName: 'Design da carroceria', StartDate: new Date('08/03/2025'), Duration: 2, Progress: 70 },
                { TaskID: 4, TaskName: 'Especificação de componentes', StartDate: new Date('08/04/2025'), Duration: 1, Progress: 60 },
            ]
        },
        {
            TaskID: 5,
            TaskName: 'Fabricação da Carroceria',
            StartDate: new Date('08/06/2025'),
            EndDate: new Date('08/12/2025'),
            subtasks: [
                { TaskID: 6, TaskName: 'Corte de chapas metálicas', StartDate: new Date('08/06/2025'), Duration: 2, Progress: 90 },
                { TaskID: 7, TaskName: 'Estampagem de peças', StartDate: new Date('08/08/2025'), Duration: 2, Progress: 75 },
                { TaskID: 8, TaskName: 'Solda da estrutura', StartDate: new Date('08/10/2025'), Duration: 3, Progress: 50 },
            ]
        },
        {
            TaskID: 9,
            TaskName: 'Sistema de Motorização',
            StartDate: new Date('08/13/2025'),
            EndDate: new Date('08/18/2025'),
            subtasks: [
                { TaskID: 10, TaskName: 'Usinagem do bloco do motor', StartDate: new Date('08/13/2025'), Duration: 2, Progress: 60 },
                { TaskID: 11, TaskName: 'Montagem do motor', StartDate: new Date('08/15/2025'), Duration: 2, Progress: 40 },
                { TaskID: 12, TaskName: 'Sistema de transmissão', StartDate: new Date('08/17/2025'), Duration: 2, Progress: 30 },
            ]
        },
        {
            TaskID: 13,
            TaskName: 'Chassi e Suspensão',
            StartDate: new Date('08/19/2025'),
            EndDate: new Date('08/23/2025'),
            subtasks: [
                { TaskID: 14, TaskName: 'Soldagem do chassi', StartDate: new Date('08/19/2025'), Duration: 2, Progress: 45 },
                { TaskID: 15, TaskName: 'Sistema de freios', StartDate: new Date('08/21/2025'), Duration: 2, Progress: 25 },
                { TaskID: 16, TaskName: 'Montagem da suspensão', StartDate: new Date('08/22/2025'), Duration: 2, Progress: 20 },
            ]
        },
        {
            TaskID: 17,
            TaskName: 'Montagem Final',
            StartDate: new Date('08/24/2025'),
            EndDate: new Date('08/29/2025'),
            subtasks: [
                { TaskID: 18, TaskName: 'Instalação do motor no chassi', StartDate: new Date('08/24/2025'), Duration: 2, Progress: 15 },
                { TaskID: 19, TaskName: 'Montagem da carroceria', StartDate: new Date('08/26/2025'), Duration: 2, Progress: 10 },
                { TaskID: 20, TaskName: 'Sistema elétrico e eletrônico', StartDate: new Date('08/27/2025'), Duration: 2, Progress: 5 },
            ]
        },
        {
            TaskID: 21,
            TaskName: 'Testes e Controle de Qualidade',
            StartDate: new Date('08/30/2025'),
            EndDate: new Date('08/31/2025'),
            subtasks: [
                { TaskID: 22, TaskName: 'Testes de funcionamento', StartDate: new Date('08/30/2025'), Duration: 1, Progress: 0 },
                { TaskID: 23, TaskName: 'Inspeção final de qualidade', StartDate: new Date('08/31/2025'), Duration: 1, Progress: 0 },
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
    treeColumnIndex: 1,
    showColumnMenu: false,
    sortSettings: {
        columns: [
            { field: 'TaskID', direction: 'Ascending' }
        ]
    },
    allowExcelExport: true,
    allowPdfExport: true,
    allowRowDragAndDrop: true,
    editSettings: {
        allowAdding: true,
        allowEditing: true,
        allowDeleting: true,
        allowTaskbarEditing: true,
        mode: 'Auto'
    },
    toolbar: ['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll', 'ExcelExport', 'PdfExport', 'Search', 'ZoomIn', 'ZoomOut', 'ZoomToFit'],
    highlightWeekends: true,
    timelineSettings: {
        timelineUnitSize: 100,
        topTier: {
            unit: 'Month',
            format: 'MMM yyyy'
        },
        bottomTier: {
            unit: 'Week',
            format: 'dd/MM'
        }
    },
    columns: [
        { field: 'TaskID', headerText: 'ID', width: 50, textAlign: 'Center', allowEditing: false },
        { field: 'TaskName', headerText: 'Tarefa', width: 280, allowEditing: true, clipMode: 'EllipsisWithTooltip' },
        { field: 'StartDate', headerText: 'Início', width: 100, format: 'dd/MM/yy', textAlign: 'Center', allowEditing: true, editType: 'datepickeredit' },
        { field: 'Duration', headerText: 'Dur.', width: 70, textAlign: 'Center', allowEditing: true, editType: 'numericedit' },
        { field: 'Progress', headerText: 'Prog.', width: 80, textAlign: 'Center', allowEditing: true, editType: 'numericedit' }
    ],
    labelSettings: {
        leftLabel: 'TaskName',
        rightLabel: 'Progress'
    },
    splitterSettings: {
        columnIndex: 2
    },
    rowHeight: 28,
    projectStartDate: new Date('08/01/2025'),
    projectEndDate: new Date('08/31/2025'),
    zoomSettings: {
        enable: true,
        zoomIn: true,
        zoomOut: true,
        zoomToFit: true
    },
    rowDrop: function (args) {
    
        if (args.dropIndex !== undefined && args.dropPosition) {
            var draggedRecord = args.data[0];
            var targetRecord = args.targetRecord;

            

            // Se foi solto "inside" (dentro de) outra tarefa, criar como subtask
            if (args.dropPosition === 'child' && targetRecord) {
                console.log('Criando subtask de:', targetRecord.TaskName);

                // Remove a tarefa da posição original
                ganttChart.deleteRecord(draggedRecord);

                // Adiciona como subtask da tarefa alvo
                setTimeout(function() {
                    ganttChart.addRecord(draggedRecord, targetRecord.TaskID, 'Child');
                }, 100);
            }
        }
        // Se foi solto em área vazia, criar nova tarefa
        else if (!args.dropIndex) {
            var newTask = {
                TaskID: getNextTaskID(),
                TaskName: 'Nova Tarefa',
                StartDate: new Date(),
                Duration: 1,
                Progress: 0
            };
            ganttChart.addRecord(newTask, null, 'Child');
        }
    },

    // Controle de drag sem hover excessivo
    rowDragStart: function (args) {
        // Adicionar classe para desabilitar hover durante drag
        ganttChart.element.classList.add('e-dragging');
    },

    rowDragEnd: function (args) {
        // Remover classe de drag e limpar estilos
        ganttChart.element.classList.remove('e-dragging');
        var rows = ganttChart.element.querySelectorAll('.e-valid-drop-target');
        rows.forEach(function(row) {
            row.classList.remove('e-valid-drop-target');
        });
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

function getLatestTaskEndDate() {
    var latestDate = new Date('1900-01-01'); // Very old date to start comparison

    function findLatestEndDate(data) {
        for (var i = 0; i < data.length; i++) {
            var task = data[i];
            var taskEndDate;

            // Calculate end date based on start date and duration
            if (task.EndDate) {
                taskEndDate = new Date(task.EndDate);
            } else if (task.StartDate && task.Duration) {
                taskEndDate = new Date(task.StartDate);
                taskEndDate.setDate(taskEndDate.getDate() + task.Duration);
            } else if (task.StartDate) {
                taskEndDate = new Date(task.StartDate);
                taskEndDate.setDate(taskEndDate.getDate() + 1); // Default 1 day duration
            }

            if (taskEndDate && taskEndDate > latestDate) {
                latestDate = taskEndDate;
            }

            // Check subtasks recursively
            if (task.subtasks && task.subtasks.length > 0) {
                findLatestEndDate(task.subtasks);
            }
        }
    }

    findLatestEndDate(ganttChart.dataSource);
    return latestDate;
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

// Aplicar Zoom to Fit automaticamente ao carregar
ganttChart.dataBound = function() {
    // Aplicar zoom to fit na primeira vez que os dados são carregados
    if (!ganttChart.isInitialLoad) {
        ganttChart.isInitialLoad = true;
        setTimeout(function() {
            ganttChart.zoomToFit();
        }, 100);
    }

    // Configurar edição com clique simples nas células
    var gridElement = ganttChart.element.querySelector('.e-gridcontent');
    if (gridElement) {
        gridElement.addEventListener('click', function(e) {
            // Verificar se clicou em ícone de expansão/colapso
            if (e.target.closest('.e-treegridexpand') || e.target.closest('.e-treegridcollapse')) {
                return; // Permitir funcionamento normal dos ícones
            }

            var targetCell = e.target.closest('td.e-rowcell');
            if (targetCell && !targetCell.classList.contains('e-editedbatchcell')) {
                var cellIndex = Array.from(targetCell.parentNode.children).indexOf(targetCell);

                // Verificar se é uma coluna editável (não incluir coluna do nome se for linha pai)
                var columns = ganttChart.columns;
                var isParentRow = targetCell.parentNode.querySelector('.e-treegridexpand, .e-treegridcollapse');

                if (columns[cellIndex] && columns[cellIndex].allowEditing !== false && columns[cellIndex].field !== 'TaskID') {
                    // Se for linha pai e coluna nome da tarefa, não ativar edição
                    if (isParentRow && columns[cellIndex].field === 'TaskName') {
                        return;
                    }

                    // Simular duplo clique para ativar edição
                    setTimeout(function() {
                        var dblClickEvent = new MouseEvent('dblclick', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        targetCell.dispatchEvent(dblClickEvent);
                    }, 10);
                }
            }
        });
    }
};
