// Inicializar cultura padrão (Portugu��s Brasil)
// Função para verificar se todas as dependências estão carregadas
function checkDependencies() {
    var dependencies = [
        { name: 'Syncfusion ej', check: function() { return typeof ej !== 'undefined'; } },
        { name: 'getProjectDataByLocale', check: function() { return typeof getProjectDataByLocale !== 'undefined'; } }
    ];

    for (var i = 0; i < dependencies.length; i++) {
        if (!dependencies[i].check()) {
            console.warn('Dependência não carregada:', dependencies[i].name);
            return false;
        }
    }
    return true;
}

// Inicializar cultura com fallback seguro
try {
    if (typeof ej !== 'undefined' && ej.base && ej.base.setCulture) {
        // Usar en-US como fallback seguro para componentes que podem ter problemas com pt-BR
        ej.base.setCulture('en-US');
        console.log('Cultura en-US definida como fallback seguro');
    } else {
        console.warn('Syncfusion não disponível para definir cultura');
    }
} catch (error) {
    console.error('Erro ao inicializar cultura:', error);
}

// Função para exibir predecessores de forma amigável na coluna
function displayPredecessors(field, data, column) {
    if (data.Predecessor) {
        // Remove FS de cada predecessor para exibir apenas os IDs
        return data.Predecessor.replace(/(\d+)FS/g, '$1').replace(/;/g, ', ');
    }
    return '';
}

var ganttChart;
try {
    // Verificar se as dependências estão carregadas
    if (!checkDependencies()) {
        throw new Error('Dependências não carregadas. Verifique se todos os scripts foram carregados.');
    }

    ganttChart = new ej.gantt.Gantt({
    dataSource: getProjectDataByLocale('pt-BR'),
    width: '100%',
    height: '100%',
    locale: 'en-US',
    taskFields: {
        id: 'TaskID',
        name: 'TaskName',
        startDate: 'StartDate',
        endDate: 'EndDate',
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
        { field: 'StartDate', headerText: 'Início', width: 90, allowEditing: true, editType: 'datepickeredit',
          edit: { params: { locale: 'en-US', format: 'M/d/yyyy' } } },
        { field: 'EndDate', headerText: 'Fim', width: 90, textAlign: 'Center', allowEditing: true, editType: 'datepickeredit',
          edit: { params: { locale: 'en-US', format: 'M/d/yyyy' } } },
        { field: 'Duration', headerText: 'Duração', width: 80, textAlign: 'Center', allowEditing: true, editType: 'numericedit',
          edit: { params: { min: 1, max: 999, step: 1, format: 'n0' } } },
        { field: 'Progress', headerText: 'Prog.', width: 70, textAlign: 'Center', allowEditing: true },
        { field: 'Predecessor', headerText: 'Predecessores', width: 120, textAlign: 'Left', allowEditing: true, clipMode: 'EllipsisWithTooltip',
          valueAccessor: displayPredecessors }
    ],
    labelSettings: {
        leftLabel: 'TaskName',
        rightLabel: 'Progress',
        taskLabel: '${Progress}%'
    },
    splitterSettings: {
        columnIndex: 3
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
        console.log('=== ROW DROP EVENT ===');
        console.log('Args:', args);
        console.log('Data:', args.data);
        console.log('Target:', args.targetRecord);
        console.log('Position:', args.dropPosition);

        // Verificar se temos dados válidos
        if (!args.data || args.data.length === 0) {
            console.log('❌ Sem dados válidos - cancelando');
            return;
        }

        var draggedTask = args.data[0];
        var targetRecord = args.targetRecord;

        // CASO 1: Dropar como filho de um grupo (child)
        if (args.dropPosition === 'child' && targetRecord) {
            console.log('📂 Movendo para dentro do grupo:', targetRecord.TaskName);
            // Deixar o Syncfusion tratar - comportamento padrão
            return;
        }

        // CASO 2: Desvincular subtarefa (above/below fora do grupo pai)
        if (ganttChart._draggedSubtask &&
            (args.dropPosition === 'above' || args.dropPosition === 'below')) {

            var parentTask = ganttChart._draggedSubtask.parent;

            // Verificar se está soltando no mesmo grupo pai
            if (targetRecord && targetRecord.TaskID === parentTask.TaskID) {
                console.log('🔄 Reordenando dentro do mesmo grupo pai');
                // Deixar comportamento padrão para reordenação
                return;
            }

            console.log('🔄 DESVINCULANDO subtarefa:', draggedTask.TaskName, 'do pai:', parentTask.TaskName);

            // Cancelar o comportamento padrão para desvinculação
            args.cancel = true;

            // Fazer a desvinculação manualmente
            setTimeout(function() {
                console.log('Removendo tarefa da posição atual...');

                // Criar cópia dos dados da tarefa
                var taskCopy = JSON.parse(JSON.stringify(draggedTask));

                // Remover tarefa atual
                ganttChart.deleteRecord(draggedTask.TaskID);

                // Aguardar remoção e adicionar como independente
                setTimeout(function() {
                    console.log('Adicionando como tarefa independente...');

                    try {
                        if (targetRecord) {
                            if (args.dropPosition === 'above') {
                                ganttChart.addRecord(taskCopy, targetRecord.TaskID, 'Above');
                            } else {
                                ganttChart.addRecord(taskCopy, targetRecord.TaskID, 'Below');
                            }
                        } else {
                            ganttChart.addRecord(taskCopy);
                        }

                        console.log('✅ DESVINCULAÇÃO CONCLUÍDA!', taskCopy.TaskName, 'agora é independente');
                    } catch (error) {
                        console.error('❌ Erro na desvinculação:', error);
                        // Se falhar, tentar restaurar a tarefa
                        console.log('🔄 Tentando restaurar tarefa...');
                        ganttChart.addRecord(taskCopy);
                    }
                }, 200);
            }, 100);

            return;
        }

        // CASO 3: Outros casos - comportamento padrão
        console.log('✅ Permitindo comportamento padrão do Syncfusion');
    },


    rowDragStart: function (args) {
        ganttChart.element.classList.add('e-dragging');

        // Mostrar botões de ação durante o drag
        var actionButtons = ganttChart.element.querySelectorAll('.subtask-action-button');
        actionButtons.forEach(function(button) {
            button.style.display = 'inline-flex';
        });

        // Salvar informações do drag para usar no drop
        if (args.data && args.data.length > 0) {
            var draggedTask = args.data[0];
            console.log('Iniciando drag de:', draggedTask.TaskName);

            // Verificar se é uma subtarefa usando a estrutura de dados
            var isSubtask = false;
            var parentData = null;

            // Buscar na estrutura de dados para encontrar o pai
            function findParent(data, targetId) {
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    if (item.subtasks && item.subtasks.length > 0) {
                        for (var j = 0; j < item.subtasks.length; j++) {
                            if (item.subtasks[j].TaskID === targetId) {
                                return item;
                            }
                        }
                        // Busca recursiva em subtarefas aninhadas
                        var found = findParent(item.subtasks, targetId);
                        if (found) return found;
                    }
                }
                return null;
            }

            parentData = findParent(ganttChart.dataSource, draggedTask.TaskID);
            isSubtask = parentData !== null;

            if (isSubtask) {
                console.log('É uma subtarefa de:', parentData.TaskName);
                // Salvar contexto no elemento gantt para usar no drop
                ganttChart._draggedSubtask = {
                    task: draggedTask,
                    parent: parentData
                };
            } else {
                console.log('É uma tarefa pai ou independente');
                ganttChart._draggedSubtask = null;
            }
        }
    },

    rowDragEnd: function (args) {
        ganttChart.element.classList.remove('e-dragging');
        var rows = ganttChart.element.querySelectorAll('.e-valid-drop-target');
        rows.forEach(function(row) {
            row.classList.remove('e-valid-drop-target');
        });

        // Limpar contexto do drag
        ganttChart._draggedSubtask = null;
    },

    actionBegin: function (args) {
        // Debug: Log de todos os eventos de actionBegin
        console.log('actionBegin:', args.requestType, args);

        // Tratamento especial para reordenação de tarefas (drag and drop)
        if (args.requestType === 'recordUpdate' && args.data && args.modifiedRecords) {
            console.log('Reordenação detectada no actionBegin');

            // Verificar se é uma operação de desvinculação
            var modifiedRecord = args.modifiedRecords[0];
            if (modifiedRecord) {
                console.log('Registro modificado:', modifiedRecord.TaskName);
                console.log('Dados da operação:', args.data);

                // Se a tarefa estava em um grupo e agora não está mais
                // podemos interceptar aqui também
            }
        }

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
    },

    cellEdit: function (args) {
        console.log('cellEdit evento:', args);
        console.log('Coluna sendo editada:', args.columnName);
        console.log('Valor atual:', args.value);
    }
    });
} catch (error) {
    console.error('Erro ao inicializar Gantt Chart:', error);
    alert('Erro ao carregar o gráfico Gantt: ' + error.message);

    // Tentar reinicializar com dados padrão
    try {
        console.log('Tentando reinicialização com dados mínimos...');
        ganttChart = new ej.gantt.Gantt({
            dataSource: [],
            width: '100%',
            height: '100%',
            locale: 'pt-BR'
        });
    } catch (fallbackError) {
        console.error('Falha na reinicialização:', fallbackError);
    }
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


// Função para habilitar edição melhorada de datas
function enableImprovedDateEditing() {
    // Esta função é chamada após a inicialização do Gantt
    // para garantir que a edição de datas funcione corretamente
    console.log('Sistema de edição de datas habilitado');
}

// Adicionar o Gantt ao DOM com tratamento de erro
if (ganttChart) {
    try {
        ganttChart.appendTo('#Gantt');

        // Melhorar usabilidade dos ícones expand/collapse após inicialização
        setTimeout(function() {
            improveExpandCollapseUsability();
            addSubtaskActionButtons();
        }, 1000);

    } catch (error) {
        console.error('Erro ao anexar Gantt ao DOM:', error);
    }
}

// Função para adicionar botões de ação nas subtasks
function addSubtaskActionButtons() {
    if (!ganttChart || !ganttChart.element) return;

    console.log('Adicionando botões de ação para subtasks...');

    // Encontrar todas as subtasks
    var subtaskRows = ganttChart.element.querySelectorAll('[class*="level1"]');

    subtaskRows.forEach(function(row) {
        // Verificar se já tem botão
        if (row.querySelector('.subtask-action-button')) return;

        var treecell = row.querySelector('.e-treecell');
        if (!treecell) return;

        // Criar botão de ação
        var actionButton = document.createElement('button');
        actionButton.className = 'subtask-action-button';
        actionButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        actionButton.title = 'Remover do grupo';
        actionButton.setAttribute('aria-label', 'Remover subtarefa do grupo');

        // Adicionar evento de clique
        actionButton.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();

            // Encontrar dados da tarefa
            var rowIndex = Array.from(row.parentNode.children).indexOf(row);
            var taskData = ganttChart.flatData[rowIndex];

            if (taskData) {
                removeSubtaskFromGroup(taskData);
            }
        });

        // FUNCIONALIDADE DROP ZONE - Tornar o botão um destino de drop
        actionButton.setAttribute('droppable', 'true');
        actionButton.classList.add('subtask-drop-zone');

        // Eventos de drag and drop no botão
        actionButton.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            actionButton.classList.add('drop-zone-active');
        });

        actionButton.addEventListener('dragenter', function(e) {
            e.preventDefault();
            e.stopPropagation();
            actionButton.classList.add('drop-zone-hover');
        });

        actionButton.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            actionButton.classList.remove('drop-zone-hover');
            actionButton.classList.remove('drop-zone-active');
        });

        actionButton.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('🎯 Subtask solta no botão de ação - removendo automaticamente');

            // Remover classes visuais
            actionButton.classList.remove('drop-zone-hover');
            actionButton.classList.remove('drop-zone-active');

            // Encontrar a tarefa que está sendo arrastada
            var draggedTaskData = null;

            // Usar o contexto salvo durante o drag
            if (ganttChart._draggedSubtask) {
                draggedTaskData = ganttChart._draggedSubtask.task;
            }

            if (draggedTaskData) {
                // Remover sem confirmação
                removeSubtaskFromGroupSilent(draggedTaskData);
            } else {
                console.warn('❌ Não foi possível identificar a tarefa sendo arrastada');
            }
        });

        // Adicionar o botão à célula
        treecell.appendChild(actionButton);
    });

    console.log('✅ Botões de ação adicionados para', subtaskRows.length, 'subtasks');
}

// Função para remover subtask do grupo (com confirmação)
function removeSubtaskFromGroup(taskData) {
    console.log('🔄 Removendo subtask do grupo:', taskData.TaskName);

    // Confirmar ação
    if (!confirm('Deseja remover "' + taskData.TaskName + '" do grupo e torná-la uma tarefa independente?')) {
        return;
    }

    // Chamar função silenciosa
    removeSubtaskFromGroupSilent(taskData);
}

// Função para remover subtask do grupo (sem confirmação - para drop zone)
function removeSubtaskFromGroupSilent(taskData) {
    console.log('🎯 Removendo subtask automaticamente:', taskData.TaskName);

    try {
        // Criar cópia dos dados da tarefa
        var taskCopy = JSON.parse(JSON.stringify(taskData));

        // Remover a tarefa atual
        ganttChart.deleteRecord(taskData.TaskID);

        // Adicionar como tarefa independente
        setTimeout(function() {
            ganttChart.addRecord(taskCopy);

            console.log('✅ Subtask removida automaticamente com sucesso:', taskCopy.TaskName);

            // Recriar os botões após a operação
            setTimeout(function() {
                addSubtaskActionButtons();
            }, 200);
        }, 100);

    } catch (error) {
        console.error('❌ Erro ao remover subtask do grupo automaticamente:', error);
        console.log('🔄 Tentando fallback...');

        // Fallback: tentar apenas remover e adicionar
        try {
            ganttChart.deleteRecord(taskData.TaskID);
            setTimeout(function() {
                ganttChart.addRecord(taskData);
            }, 100);
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
        }
    }
}

// Função para melhorar usabilidade dos ícones expand/collapse
function improveExpandCollapseUsability() {
    if (!ganttChart || !ganttChart.element) return;

    // Adicionar tooltips aos ícones
    function addTooltipsToIcons() {
        var expandIcons = ganttChart.element.querySelectorAll('.e-treegridexpand');
        var collapseIcons = ganttChart.element.querySelectorAll('.e-treegridcollapse');

        expandIcons.forEach(function(icon) {
            icon.setAttribute('title', 'Clique para expandir grupo');
            icon.setAttribute('aria-label', 'Expandir grupo');
        });

        collapseIcons.forEach(function(icon) {
            icon.setAttribute('title', 'Clique para colapsar grupo');
            icon.setAttribute('aria-label', 'Colapsar grupo');
        });
    }

    // Adicionar atalhos de teclado
    function addKeyboardShortcuts() {
        ganttChart.element.addEventListener('keydown', function(event) {
            var selectedRowIndex = ganttChart.selectedRowIndex;
            if (selectedRowIndex >= 0) {
                var selectedRow = ganttChart.flatData[selectedRowIndex];

                // Tecla '+' ou '=' para expandir
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    if (selectedRow && selectedRow.hasChildRecords) {
                        ganttChart.expandByID(selectedRow.TaskID);
                    }
                }

                // Tecla '-' para colapsar
                if (event.key === '-') {
                    event.preventDefault();
                    if (selectedRow && selectedRow.hasChildRecords) {
                        ganttChart.collapseByID(selectedRow.TaskID);
                    }
                }

                // Tecla '*' para expandir tudo
                if (event.key === '*') {
                    event.preventDefault();
                    ganttChart.expandAll();
                }

                // Ctrl + '-' para colapsar tudo
                if (event.ctrlKey && event.key === '-') {
                    event.preventDefault();
                    ganttChart.collapseAll();
                }
            }
        });
    }

    // Adicionar indicadores visuais melhores
    function addVisualIndicators() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    addTooltipsToIcons();
                }
            });
        });

        observer.observe(ganttChart.element, {
            childList: true,
            subtree: true
        });
    }

    // Executar melhorias
    addTooltipsToIcons();
    addKeyboardShortcuts();
    addVisualIndicators();

    console.log('✅ Melhorias de usabilidade aplicadas aos ícones expand/collapse');
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
                // Verificar se é linha pai (grupo)
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
                    if (isParentRow) {
                        // Para grupos pai: simular duplo clique através do sistema de timer
                        var cellId = 'cell_' + selectedRowIndex + '_' + Array.from(cells).indexOf(targetCell);

                        console.log('Enter pressionado em grupo pai - simulando duplo clique');

                        // Simular primeiro clique
                        if (clickTimers[cellId]) {
                            clearTimeout(clickTimers[cellId]);
                        }

                        // Simular segundo clique imediatamente (via Enter)
                        setTimeout(function() {
                            var dblClickEvent = new MouseEvent('dblclick', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            targetCell.dispatchEvent(dblClickEvent);
                        }, 50);
                    } else {
                        // Para subtarefas: edição normal
                        setTimeout(function() {
                            var dblClickEvent = new MouseEvent('dblclick', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            targetCell.dispatchEvent(dblClickEvent);
                        }, 50);
                    }
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
                enableImprovedDateEditing();
                // Aplicar melhorias de usabilidade sempre que os dados mudarem
                improveExpandCollapseUsability();
                addSubtaskActionButtons();
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

// Variável para controlar duplo clique em grupos
var clickTimers = {};

// Handler para clique nas células
function handleCellClick(event) {
    var target = event.target;

    // Verificar se clicou em uma célula editável
    var cell = target.closest('td.e-rowcell');
    if (!cell) return;

    var row = cell.closest('tr.e-row');
    if (!row) return;

    // Verificar se a célula é edit��vel
    var cellIndex = Array.from(row.children).indexOf(cell);
    var columns = ganttChart.columns;

    if (columns[cellIndex] && columns[cellIndex].allowEditing !== false && columns[cellIndex].field !== 'TaskID') {
        // Verificar se é linha pai (grupo)
        var isParentRow = row.querySelector('.e-treegridexpand, .e-treegridcollapse');
        var rowIndex = Array.from(row.parentNode.children).indexOf(row);

        // Selecionar a linha primeiro
        ganttChart.selectRow(rowIndex);

        if (isParentRow) {
            // Para grupos pai: exigir duplo clique
            var cellId = 'cell_' + rowIndex + '_' + cellIndex;

            if (clickTimers[cellId]) {
                // É o segundo clique - ativar edição
                clearTimeout(clickTimers[cellId]);
                delete clickTimers[cellId];

                console.log('Duplo clique detectado em grupo pai - ativando edição');

                setTimeout(function() {
                    var dblClickEvent = new MouseEvent('dblclick', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    cell.dispatchEvent(dblClickEvent);
                }, 50);
            } else {
                // É o primeiro clique - aguardar segundo clique
                console.log('Primeiro clique em grupo pai - aguardando segundo clique');

                clickTimers[cellId] = setTimeout(function() {
                    // Timeout - foi apenas um clique
                    delete clickTimers[cellId];
                    console.log('Apenas um clique em grupo pai - edição não ativada');
                }, 300); // 300ms para detectar duplo clique
            }
        } else {
            // Para subtarefas: manter clique simples
            console.log('Clique simples em subtarefa - ativando edição');

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
}
