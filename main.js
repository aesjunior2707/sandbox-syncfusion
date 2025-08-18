// Inicializar cultura padrão (Portugu��s Brasil)
try {
    if (typeof ej !== 'undefined' && ej.base && ej.base.setCulture) {
        ej.base.setCulture('pt-BR');
    }
} catch (error) {
    console.error('Erro ao inicializar cultura:', error);
}

var ganttChart;
try {
    ganttChart = new ej.gantt.Gantt({
    dataSource: getProjectDataByLocale('pt-BR'),
    width: '100%',
    height: '100%',
    locale: 'pt-BR',
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
    toolbar: ['Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll', 'ExcelExport', 'PdfExport', 'Search', 'ZoomIn', 'ZoomOut', 'ZoomToFit'],
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
        { field: 'TaskName', headerText: 'Tarefa', width: 250, allowEditing: true, clipMode: 'EllipsisWithTooltip' },
        { field: 'StartDate', headerText: 'Início', width: 90, format: 'dd/MM/yy', textAlign: 'Center', allowEditing: true, editType: 'datepickeredit' },
        { field: 'EndDateCustom', headerText: 'Fim', width: 90, textAlign: 'Center', allowEditing: true, editType: 'stringedit',
          valueAccessor: displayEndDate, edit: { params: { placeholder: 'dd/mm/aa' } } },
        { field: 'Duration', headerText: 'Duração', width: 80, textAlign: 'Center', allowEditing: true, editType: 'numericedit' },
        { field: 'Progress', headerText: 'Prog.', width: 70, textAlign: 'Center', allowEditing: true, editType: 'numericedit' },
        { field: 'Predecessor', headerText: 'Predecessores', width: 120, textAlign: 'Left', allowEditing: true, editType: 'stringedit', clipMode: 'EllipsisWithTooltip',
          valueAccessor: displayPredecessors, edit: { params: { placeholder: 'Ex: 1,2,3' } } }
    ],
    labelSettings: {
        leftLabel: 'TaskName',
        rightLabel: 'Progress',
        taskLabel: '${Progress}%'
    },
    splitterSettings: {
        columnIndex: 4
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
    },

    actionBegin: function (args) {
        // Debug: Log de todos os eventos de actionBegin
        console.log('actionBegin:', args.requestType, args);

        // Processa predecessores antes de salvar
        if (args.requestType === 'save' && args.data && args.data.Predecessor !== undefined) {
            var originalValue = args.data.Predecessor;

            // Validar predecessores
            var validation = validatePredecessors(originalValue, args.data.TaskID);
            if (!validation.isValid) {
                args.cancel = true;
                alert('Erro nos predecessores: ' + validation.message);
                return;
            }

            // Processar predecessores com regra FS
            var processedPredecessors = parsePredecessors(originalValue);
            args.data.Predecessor = processedPredecessors;

            console.log('Predecessores processados:', originalValue, '->', processedPredecessors);
        }

        // Validar e sincronizar datas/duração
        if (args.requestType === 'save' && args.data) {
            try {
                var startDate = args.data.StartDate;
                var endDate = args.data.EndDate;
                var duration = args.data.Duration;

                // Validação básica de datas
                if (startDate && endDate) {
                    var start = new Date(startDate);
                    var end = new Date(endDate);

                    // Verificar se data fim é posterior à data início
                    if (end < start) {
                        args.cancel = true;
                        alert('Erro: A data fim não pode ser anterior à data de início.');
                        return;
                    }

                    // Calcular diferença em dias (inclusivo)
                    var timeDiff = end.getTime() - start.getTime();
                    var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    // Atualizar duração baseada nas datas
                    args.data.Duration = daysDiff > 0 ? daysDiff : 1;
                    console.log('Duração calculada:', args.data.Duration, 'dias');
                }

                // Validar duração mínima
                if (args.data.Duration !== undefined && args.data.Duration <= 0) {
                    args.data.Duration = 1;
                    console.log('Duração ajustada para 1 dia (mínimo)');
                }

                console.log('Dados sendo salvos:', args.data);
            } catch (error) {
                console.error('Erro na validação:', error);
                alert('Erro na validação: ' + error.message);
                // Não cancelar, apenas logar o erro
            }
        }

        // Respeitar links de predecessores durante validação
        if (args.requestType === 'validateLinkedTask') {
            args.validateMode = { respectLink: true };
        }
    },

    actionComplete: function (args) {
        // Log para acompanhar alterações
        if (args.requestType === 'save' && args.data) {
            if (args.data.Predecessor !== undefined) {
                console.log('Predecessores salvos para tarefa', args.data.TaskID + ':', args.data.Predecessor);
            }

            // Log mudanças de data e duração
            if (args.data.StartDate || args.data.EndDate || args.data.Duration) {
                console.log('Tarefa', args.data.TaskID, 'atualizada:', {
                    inicio: args.data.StartDate,
                    fim: args.data.EndDate,
                    duracao: args.data.Duration
                });
            }
        }
    }
    });
} catch (error) {
    console.error('Erro ao inicializar Gantt Chart:', error);
    alert('Erro ao carregar o gráfico Gantt. Verifique o console para mais detalhes.');
}

// Função para exibir predecessores de forma amigável na coluna
function displayPredecessors(field, data, column) {
    if (data.Predecessor) {
        // Remove FS de cada predecessor para exibir apenas os IDs
        return data.Predecessor.replace(/(\d+)FS/g, '$1').replace(/;/g, ', ');
    }
    return '';
}

// Função para parsing de predecessores separados por vírgula e aplicação da regra FS
function parsePredecessors(predecessorString) {
    if (!predecessorString || predecessorString.trim() === '') {
        return '';
    }

    // Remove espaços e quebra em vírgulas
    var predecessorIds = predecessorString.split(',').map(function(id) { return id.trim(); }).filter(function(id) { return id !== ''; });

    // Aplica a regra FS a cada predecessor se não estiver especificada
    var processedPredecessors = predecessorIds.map(function(id) {
        // Remove caracteres não numéricos e verifica se é um número válido
        var numericId = id.replace(/[^\d]/g, '');
        if (numericId && !isNaN(numericId)) {
            // Se já contém uma regra (FS, SS, FF, SF), mantém como está
            if (id.match(/\d+(FS|SS|FF|SF)/)) {
                return id;
            } else {
                // Aplica a regra FS automaticamente
                return numericId + 'FS';
            }
        }
        return null;
    }).filter(function(pred) { return pred !== null; });

    return processedPredecessors.join(';');
}

// Função para validar se os predecessores existem
function validatePredecessors(predecessorString, currentTaskId) {
    if (!predecessorString || predecessorString.trim() === '') {
        return { isValid: true, message: '' };
    }

    var predecessorIds = predecessorString.split(',').map(function(id) { return id.trim().replace(/[^\d]/g, ''); });
    var allTaskIds = getAllTaskIds();

    for (var i = 0; i < predecessorIds.length; i++) {
        var predId = predecessorIds[i];
        if (predId === '') continue;

        var numericPredId = parseInt(predId);

        // Verifica se o predecessor existe
        if (!allTaskIds.includes(numericPredId)) {
            return {
                isValid: false,
                message: `Tarefa ${numericPredId} não existe.`
            };
        }

        // Verifica se não está tentando criar dependência circular
        if (numericPredId === currentTaskId) {
            return {
                isValid: false,
                message: 'Uma tarefa não pode ser predecessora de si mesma.'
            };
        }
    }

    return { isValid: true, message: '' };
}

// Função para obter todos os IDs de tarefas
function getAllTaskIds() {
    const taskIds = [];

    function extractIds(data) {
        for (const item of data) {
            taskIds.push(item.TaskID);
            if (item.subtasks && item.subtasks.length > 0) {
                extractIds(item.subtasks);
            }
        }
    }

    extractIds(ganttChart.dataSource);
    return taskIds;
}

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
            if (event.key === 'Enter' && !ganttChart.isEdit) {
                event.preventDefault();
                activateEditForSelectedRow();
            }

            // Arrow Down key - navegação com auto-edição
            else if (event.key === 'ArrowDown') {
                // Se está em edição, cancelar edição atual e mover para próxima linha
                if (ganttChart.isEdit) {
                    event.preventDefault();
                    // Finalizar edição atual
                    ganttChart.endEdit();

                    setTimeout(function() {
                        var newIndex = selectedRowIndex + 1;

                        // Se chegou na última linha, criar nova tarefa
                        if (newIndex >= totalRows) {
                            createNewEmptyTask();
                        } else {
                            // Mover para próxima linha e ativar edição
                            ganttChart.selectRow(newIndex);
                            setTimeout(function() {
                                activateEditForSelectedRow();
                            }, 100);
                        }
                    }, 50);
                }
                // Se não está em edição e está na última linha
                else if (selectedRowIndex >= totalRows - 1) {
                    event.preventDefault();
                    createNewEmptyTask();
                }
            }
            // Arrow Up key - navegação com auto-edição
            else if (event.key === 'ArrowUp') {
                // Se está em edição, cancelar edição atual e mover para linha anterior
                if (ganttChart.isEdit && selectedRowIndex > 0) {
                    event.preventDefault();
                    // Finalizar edição atual
                    ganttChart.endEdit();

                    setTimeout(function() {
                        var newIndex = selectedRowIndex - 1;
                        ganttChart.selectRow(newIndex);
                        setTimeout(function() {
                            activateEditForSelectedRow();
                        }, 100);
                    }, 50);
                }
            }
            // Arrow Left/Right - navegação horizontal entre células
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                if (ganttChart.isEdit) {
                    event.preventDefault();
                    // Finalizar edição atual
                    ganttChart.endEdit();

                    setTimeout(function() {
                        // Encontrar próxima célula editável na mesma linha
                        var currentCell = findCurrentEditableCell();
                        var nextCell = findNextEditableCell(currentCell, event.key === 'ArrowRight');

                        if (nextCell) {
                            setTimeout(function() {
                                var dblClickEvent = new MouseEvent('dblclick', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                nextCell.dispatchEvent(dblClickEvent);
                            }, 100);
                        }
                    }, 50);
                }
            }
   
            else if (event.key === 'Tab' && selectedRowIndex >= totalRows - 1 && !ganttChart.isEdit) {
                event.preventDefault();
                createNewEmptyTask();
            }
        }
    }

});

// Função para calcular EndDate em dados que não possuem
function calculateMissingEndDates(data) {
    for (var i = 0; i < data.length; i++) {
        var task = data[i];

        // Se tem StartDate e Duration mas não tem EndDate, calcular
        if (task.StartDate && task.Duration && !task.EndDate) {
            var startDate = new Date(task.StartDate);
            var endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + task.Duration);
            task.EndDate = endDate;
            console.log('EndDate calculada para tarefa', task.TaskID + ':', endDate);
        }

        // Processar subtarefas recursivamente
        if (task.subtasks && task.subtasks.length > 0) {
            calculateMissingEndDates(task.subtasks);
        }
    }
}

// Adicionar o Gantt ao DOM com tratamento de erro
if (ganttChart) {
    try {
        // Calcular EndDate para tarefas que não possuem
        var currentData = ganttChart.dataSource;
        calculateMissingEndDates(currentData);

        ganttChart.appendTo('#Gantt');
    } catch (error) {
        console.error('Erro ao anexar Gantt ao DOM:', error);
    }
}
document.addEventListener('keydown', function(event) {
    // Verifica se a tecla pressionada é F7
    if (event.key === "F7") {
        event.preventDefault(); // evita comportamento padrão
        console.log("F7 pressionado!");
        var enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(enterEvent);
    }

    // Verifica se a linha está em edição e as teclas de navegação são pressionadas
    if (ganttChart.isEdit) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            console.log("Navegação com seta pressionada durante edição:", event.key);
            event.preventDefault(); // evita comportamento padrão
            var enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(enterEvent);
        }
    }
});

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

// Configurar função dataBound com tratamento de erro
if (ganttChart) {
    ganttChart.dataBound = function() {
        try {
            if (!ganttChart.isInitialLoad) {
                ganttChart.isInitialLoad = true;
                setTimeout(function() {
                    if (ganttChart && ganttChart.fitToProject) {
                        ganttChart.fitToProject();
                    }
                }, 100);
            }

            // Adicionar evento de clique simples para edição
            setTimeout(function() {
                addClickEditFunctionality();
            }, 200);
        } catch (error) {
            console.error('Erro na função dataBound:', error);
        }
    };
}

// Função para adicionar funcionalidade de edição por clique simples
function addClickEditFunctionality() {
    try {
        if (ganttChart && ganttChart.element) {
            var gridContent = ganttChart.element.querySelector('.e-gridcontent');
            if (gridContent) {
                // Remover eventos anteriores para evitar duplicação
                gridContent.removeEventListener('click', handleCellClick);
                // Adicionar novo evento
                gridContent.addEventListener('click', handleCellClick);
            }
        }
    } catch (error) {
        console.error('Erro ao adicionar funcionalidade de edição:', error);
    }
}

// Função para encontrar a célula editável atual
function findCurrentEditableCell() {
    var selectedRowIndex = ganttChart.selectedRowIndex;
    if (selectedRowIndex < 0) return null;

    var gridContent = ganttChart.element.querySelector('.e-gridcontent');
    if (!gridContent) return null;

    var rows = gridContent.querySelectorAll('tr.e-row');
    var selectedRow = rows[selectedRowIndex];
    if (!selectedRow) return null;

    // Procurar pela célula que está sendo editada
    var editCell = selectedRow.querySelector('.e-editedboundcell, .e-editcell');
    return editCell;
}

// Função para encontrar próxima célula editável
function findNextEditableCell(currentCell, moveRight) {
    if (!currentCell) return null;

    var row = currentCell.closest('tr.e-row');
    if (!row) return null;

    var cells = row.querySelectorAll('td.e-rowcell');
    var currentIndex = Array.from(cells).indexOf(currentCell);
    if (currentIndex < 0) return null;

    var columns = ganttChart.columns;
    var isParentRow = row.querySelector('.e-treegridexpand, .e-treegridcollapse');

    // Determinar direção da busca
    var direction = moveRight ? 1 : -1;
    var startIndex = currentIndex + direction;

    // Procurar próxima célula editável
    for (var i = startIndex; i >= 0 && i < cells.length; i += direction) {
        if (columns[i] && columns[i].allowEditing !== false && columns[i].field !== 'TaskID') {
            // Se for linha pai, pular a coluna TaskName
            if (isParentRow && columns[i].field === 'TaskName') {
                continue;
            }
            return cells[i];
        }
    }

    return null;
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
