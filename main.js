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

            if (args.dropPosition === 'child' && targetRecord) {
                console.log('Criando subtask de:', targetRecord.TaskName);

                ganttChart.deleteRecord(draggedRecord);

                setTimeout(function() {
                    ganttChart.addRecord(draggedRecord, targetRecord.TaskID, 'Child');
                }, 100);
            }
        }
       
        else if (!args.dropIndex) {
            var newTask = {
                TaskID: getNextTaskID(),
                TaskName: 'Nova Tarefa',
                StartDate: new Date(),
                Duration: 1,
                Progress: 0
            };
            ganttChart.addRecord(newTask, null, 'Child');

            // Ativar edição automaticamente na nova tarefa
            setTimeout(function() {
                var newRowIndex = ganttChart.flatData.length - 1;
                ganttChart.selectRow(newRowIndex);
                setTimeout(function() {
                    activateEditForSelectedRow();
                }, 200);
            }, 100);
        }
    },


    rowDragStart: function (args) {
        ganttChart.element.classList.add('e-dragging');
    },

    rowDragEnd: function (args) {
        ganttChart.element.classList.remove('e-dragging');
        var rows = ganttChart.element.querySelectorAll('.e-valid-drop-target');
        rows.forEach(function(row) {
            row.classList.remove('e-valid-drop-target');
        });
    }
});

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

            if (task.subtasks && task.subtasks.length > 0) {
                findLatestEndDate(task.subtasks);
            }
        }
    }

    findLatestEndDate(ganttChart.dataSource);
    return latestDate;
}

function createNewEmptyTask() {
    var latestEndDate = getLatestTaskEndDate();

    var newStartDate = new Date(latestEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    var newTask = {
        TaskID: getNextTaskID(),
        TaskName: 'Nova Tarefa',
        StartDate: newStartDate,
        Duration: 1,
        Progress: 0
    };

    ganttChart.addRecord(newTask);

    setTimeout(function() {
        var newRowIndex = ganttChart.flatData.length - 1;
        ganttChart.selectRow(newRowIndex);

        // Ativar edição automaticamente na nova tarefa
        setTimeout(function() {
            activateEditForSelectedRow();
        }, 200);
    }, 100);
}

function checkAndCreateNewRow(rowIndex) {
    var totalRows = ganttChart.flatData.length;

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

document.addEventListener('keydown', function(event) {
    if (ganttChart && ganttChart.element) {
        var selectedRowIndex = ganttChart.selectedRowIndex;
        var totalRows = ganttChart.flatData.length;

        if (document.activeElement && ganttChart.element.contains(document.activeElement)) {
            // Enter key - ativar edição na linha selecionada
            if (event.key === 'Enter' && !ganttChart.isEdit) {
                event.preventDefault();
                activateEditForSelectedRow();
            }
            // Arrow Down key
            else if (event.key === 'ArrowDown' && selectedRowIndex >= totalRows - 1) {
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

// Função para ativar edição na linha selecionada
function activateEditForSelectedRow() {
    var selectedRowIndex = ganttChart.selectedRowIndex;
    if (selectedRowIndex >= 0) {
        var gridContent = ganttChart.element.querySelector('.e-gridcontent');
        if (gridContent) {
            var rows = gridContent.querySelectorAll('tr.e-row');
            var selectedRow = rows[selectedRowIndex];

            if (selectedRow) {
                // Verificar se é linha pai (não editável na coluna TaskName)
                var isParentRow = selectedRow.querySelector('.e-treegridexpand, .e-treegridcollapse');

                var cells = selectedRow.querySelectorAll('td.e-rowcell');
                var targetCell = null;

                // Encontrar a primeira célula editável
                for (var i = 0; i < cells.length; i++) {
                    var cellIndex = i;
                    var columns = ganttChart.columns;

                    if (columns[cellIndex] && columns[cellIndex].allowEditing !== false && columns[cellIndex].field !== 'TaskID') {
                        // Se for linha pai, pular a coluna TaskName
                        if (isParentRow && columns[cellIndex].field === 'TaskName') {
                            continue;
                        }
                        // Preferir TaskName para linhas filhas
                        if (!isParentRow && columns[cellIndex].field === 'TaskName') {
                            targetCell = cells[i];
                            break;
                        }
                        // Usar primeira célula editável como fallback
                        if (!targetCell) {
                            targetCell = cells[i];
                        }
                    }
                }

                if (targetCell) {
                    setTimeout(function() {
                        var dblClickEvent = new MouseEvent('dblclick', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        targetCell.dispatchEvent(dblClickEvent);
                    }, 50);
                    return true;
                }
            }
        }
    }
    return false;
}

ganttChart.dataBound = function() {

    if (!ganttChart.isInitialLoad) {
        ganttChart.isInitialLoad = true;
        setTimeout(function() {
            ganttChart.fitToProject();
        }, 100);
    }

    // Adicionar evento de clique simples para edição
    setTimeout(function() {
        addClickEditFunctionality();
    }, 200);
};

// Função para adicionar funcionalidade de edição por clique simples
function addClickEditFunctionality() {
    var gridContent = ganttChart.element.querySelector('.e-gridcontent');
    if (gridContent) {
        // Remover eventos anteriores para evitar duplicação
        gridContent.removeEventListener('click', handleCellClick);
        // Adicionar novo evento
        gridContent.addEventListener('click', handleCellClick);
    }
}

// Handler para clique nas células
function handleCellClick(event) {
    var target = event.target;

    // Verificar se clicou em uma célula editável
    var cell = target.closest('td.e-rowcell');
    if (!cell) return;

    var row = cell.closest('tr.e-row');
    if (!row) return;

    // Verificar se a célula é editável
    var cellIndex = Array.from(row.children).indexOf(cell);
    var columns = ganttChart.columns;

    if (columns[cellIndex] && columns[cellIndex].allowEditing !== false && columns[cellIndex].field !== 'TaskID') {
        // Verificar se é linha pai e se estamos clicando na coluna TaskName
        var isParentRow = row.querySelector('.e-treegridexpand, .e-treegridcollapse');
        if (isParentRow && columns[cellIndex].field === 'TaskName') {
            return; // Não permitir edição do nome em tarefas pai
        }

        // Selecionar a linha primeiro
        var rowIndex = Array.from(row.parentNode.children).indexOf(row);
        ganttChart.selectRow(rowIndex);

        // Ativar edição com um pequeno delay
        setTimeout(function() {
            var dblClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            cell.dispatchEvent(dblClickEvent);
        }, 100);
    }
}
