// Inicializar cultura padrão
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
        ej.base.setCulture('en-US');
        console.log('Cultura en-US definida');
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
    projectStartDate: new Date('08/01/2025'),
    projectEndDate: new Date('08/31/2025'),
    zoomSettings: {
        enable: true,
        zoomIn: true,
        zoomOut: true,
        zoomToFit: true
    },
    // DRAG AND DROP BÁSICO - SEM CUSTOMIZAÇÕES
    rowDrop: function (args) {
        // Comportamento padrão do Syncfusion - sem interceptações
        console.log('Row drop:', args.data[0] ? args.data[0].TaskName : 'Unknown');
    },

    actionBegin: function (args) {
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
        }
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
            locale: 'en-US'
        });
    } catch (fallbackError) {
        console.error('Falha na reinicialização:', fallbackError);
    }
}

// FUNÇÕES DE PREDECESSOR - MANTIDAS
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

// Função para obter mensagens traduzidas
function getMessages(locale) {
    const messages = {
        'en-US': {
            confirmClear: 'Are you sure you want to clear all tasks? This action cannot be undone.',
            confirmRestore: 'Do you want to restore the default project data?',
            clearSuccess: 'All tasks have been removed successfully!',
            restoreSuccess: 'Default data restored successfully!',
            clearError: 'Error clearing tasks: ',
            restoreError: 'Error restoring data: ',
            ganttNotAvailable: 'Gantt Chart is not available',
            newTaskName: 'New Task'
        },
        'pt-BR': {
            confirmClear: 'Tem certeza que deseja limpar todas as tarefas? Esta ação não pode ser desfeita.',
            confirmRestore: 'Deseja restaurar os dados padrão do projeto?',
            clearSuccess: 'Todas as tarefas foram removidas com sucesso!',
            restoreSuccess: 'Dados padrão restaurados com sucesso!',
            clearError: 'Erro ao limpar tarefas: ',
            restoreError: 'Erro ao restaurar dados: ',
            ganttNotAvailable: 'Gantt Chart não está disponível',
            newTaskName: 'Nova Tarefa'
        },
        'es-ES': {
            confirmClear: '¿Está seguro de que desea limpiar todas las tareas? Esta acción no se puede deshacer.',
            confirmRestore: '¿Desea restaurar los datos por defecto del proyecto?',
            clearSuccess: '¡Todas las tareas han sido eliminadas con éxito!',
            restoreSuccess: '¡Datos por defecto restaurados con éxito!',
            clearError: 'Error al limpiar tareas: ',
            restoreError: 'Error al restaurar datos: ',
            ganttNotAvailable: 'Gantt Chart no está disponible',
            newTaskName: 'Nueva Tarea'
        }
    };
    return messages[locale] || messages['en-US'];
}

// Função para limpar todas as tasks do data source
function clearAllTasks() {
    if (ganttChart) {
        try {
            // Obter idioma atual
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);

            // Confirmar ação com o usuário
            var confirmClear = confirm(msgs.confirmClear);

            if (confirmClear) {
                // Limpar o data source
                ganttChart.dataSource = [];

                // Atualizar o componente
                ganttChart.refresh();

                // Aguardar um momento para o refresh completar e então adicionar nova linha
                setTimeout(function() {
                    try {
                        // Criar uma nova tarefa com nome traduzido
                        var newTask = {
                            TaskID: 1,
                            TaskName: msgs.newTaskName,
                            StartDate: new Date(),
                            Duration: 1,
                            Progress: 0
                        };

                        // Adicionar a nova tarefa
                        ganttChart.addRecord(newTask);
                        console.log('Nova tarefa adicionada:', newTask);

                        // Aguardar um pouco mais e então iniciar edição na primeira linha
                        setTimeout(function() {
                            try {
                                // Verificar se a linha foi realmente adicionada
                                if (!ganttChart.dataSource || ganttChart.dataSource.length === 0) {
                                    console.log('Nenhuma linha encontrada para editar');
                                    return;
                                }

                                console.log('Tentando iniciar edição. Linhas disponíveis:', ganttChart.dataSource.length);

                                // Método correto 1: usar treeGrid.editCell para editar célula específica
                                if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                                    ganttChart.treeGrid.editCell(0, 'TaskName');
                                    console.log('Edição iniciada via treeGrid.editCell');
                                }
                                // Método correto 2: usar startEdit com taskId
                                else if (ganttChart.startEdit) {
                                    ganttChart.startEdit(1); // ID da nova tarefa criada
                                    console.log('Edição iniciada via startEdit com taskId');
                                }
                                // Método correto 3: usar beginEdit com o registro
                                else if (ganttChart.beginEdit && ganttChart.dataSource && ganttChart.dataSource.length > 0) {
                                    ganttChart.beginEdit(ganttChart.dataSource[0]);
                                    console.log('Edição iniciada via beginEdit com record');
                                }

                                // Aguardar um pouco mais para focar no campo TaskName
                                setTimeout(function() {
                                    try {
                                        // Tentar focar no campo TaskName com múltiplos seletores
                                        var taskNameInput = document.querySelector(
                                            '.e-treegrid .e-editedbatchcell input, ' +
                                            '.e-treegrid .e-inline-edit input[aria-label*="Task"], ' +
                                            '.e-treegrid .e-inline-edit input[name="TaskName"], ' +
                                            '.e-treegrid .e-editedrow input, ' +
                                            '.e-treegrid td[aria-describedby*="TaskName"] input, ' +
                                            '.e-treegrid .e-rowcell input[aria-label*="TaskName"], ' +
                                            'input[aria-label*="Task Name"]'
                                        );
                                        if (taskNameInput) {
                                            taskNameInput.focus();
                                            taskNameInput.select(); // Selecionar o texto para facilitar edição
                                            console.log('Campo TaskName focado automaticamente');
                                        } else {
                                            console.log('Campo TaskName não encontrado para foco automático');
                                        }
                                    } catch (focusError) {
                                        console.log('Não foi possível focar no campo TaskName automaticamente:', focusError);
                                    }
                                }, 200);

                                console.log('Nova linha criada e colocada em modo de edição');
                            } catch (editError) {
                                console.error('Erro ao iniciar edição:', editError);
                                console.log('Métodos de edição disponíveis:', {
                                    'treeGrid.editCell': !!(ganttChart.treeGrid && ganttChart.treeGrid.editCell),
                                    'startEdit': !!(ganttChart.startEdit),
                                    'beginEdit': !!(ganttChart.beginEdit)
                                });
                            }
                        }, 300);

                    } catch (addError) {
                        console.error('Erro ao adicionar nova linha:', addError);
                    }
                }, 300);

                console.log('Todas as tarefas foram removidas do data source');
                alert(msgs.clearSuccess);
            }
        } catch (error) {
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);
            console.error('Erro ao limpar tasks:', error);
            alert(msgs.clearError + error.message);
        }
    } else {
        var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
        var msgs = getMessages(currentLanguage);
        console.error('Gantt Chart não está inicializado');
        alert(msgs.ganttNotAvailable);
    }
}

// Função para restaurar dados padrão baseado no idioma atual
function restoreDefaultTasks() {
    if (ganttChart) {
        try {
            // Obter idioma atual do seletor
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);

            // Confirmar ação com o usuário
            var confirmRestore = confirm(msgs.confirmRestore);

            if (confirmRestore) {
                // Restaurar dados padrão
                ganttChart.dataSource = getProjectDataByLocale(currentLanguage);

                // Atualizar o componente
                ganttChart.refresh();

                // Ajustar zoom após carregar dados
                setTimeout(function() {
                    if (ganttChart && ganttChart.fitToProject) {
                        ganttChart.fitToProject();
                    }
                }, 200);

                console.log('Dados padrão restaurados para idioma:', currentLanguage);
                alert(msgs.restoreSuccess);
            }
        } catch (error) {
            var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
            var msgs = getMessages(currentLanguage);
            console.error('Erro ao restaurar dados padrão:', error);
            alert(msgs.restoreError + error.message);
        }
    }
}

// Variável para armazenar a linha atualmente selecionada
var currentSelectedRowIndex = -1;

// Função para configurar evento Enter para edição
function setupEnterKeyEditing() {
    // Aguardar o componente estar totalmente carregado
    setTimeout(function() {
        try {
            // Adicionar event listener para tecla Enter no container do Gantt
            var ganttElement = document.getElementById('Gantt');
            if (ganttElement) {
                ganttElement.addEventListener('keydown', function(event) {
                    // Verificar se Enter foi pressionado
                    if (event.key === 'Enter' || event.keyCode === 13) {
                        try {
                            var rowIndexToEdit = -1;
                            var taskData = null;

                            // Método 1: Usar linha selecionada armazenada
                            if (currentSelectedRowIndex >= 0) {
                                rowIndexToEdit = currentSelectedRowIndex;
                            } else {
                                // Método 2: Encontrar linha selecionada no DOM
                                var selectedRows = document.querySelectorAll('.e-treegrid .e-row.e-active, .e-treegrid .e-row[aria-selected="true"], .e-treegrid .e-row.e-focus');
                                if (selectedRows.length > 0) {
                                    var selectedRow = selectedRows[selectedRows.length - 1]; // Última linha selecionada
                                    rowIndexToEdit = Array.from(selectedRow.parentElement.children).indexOf(selectedRow);
                                    // Ajustar índice se houver header
                                    if (rowIndexToEdit > 0) rowIndexToEdit -= 1;
                                }
                            }

                            // Método 3: Usar seleção do próprio Gantt
                            if (rowIndexToEdit < 0 && ganttChart && ganttChart.selectionSettings) {
                                var selectedRowIndexes = ganttChart.getSelectedRowIndexes();
                                if (selectedRowIndexes && selectedRowIndexes.length > 0) {
                                    rowIndexToEdit = selectedRowIndexes[0];
                                }
                            }

                            // Verificar se encontramos uma linha válida e obter dados
                            if (rowIndexToEdit >= 0 && ganttChart && ganttChart.dataSource && ganttChart.dataSource.length > rowIndexToEdit) {
                                taskData = ganttChart.dataSource[rowIndexToEdit];
                                var taskId = taskData.TaskID;

                                console.log('Enter pressionado na linha:', rowIndexToEdit, 'TaskID:', taskId);

                                // Prevenir comportamento padrão do Enter
                                event.preventDefault();
                                event.stopPropagation();

                                // Iniciar edição usando diferentes métodos
                                if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                                    // Método 1: Editar célula TaskName
                                    ganttChart.treeGrid.editCell(rowIndexToEdit, 'TaskName');
                                    console.log('Edição iniciada via treeGrid.editCell');
                                } else if (ganttChart.startEdit && taskId) {
                                    // Método 2: Iniciar edição por TaskID
                                    ganttChart.startEdit(taskId);
                                    console.log('Edição iniciada via startEdit');
                                } else if (ganttChart.beginEdit && taskData) {
                                    // Método 3: Iniciar edição por record
                                    ganttChart.beginEdit(taskData);
                                    console.log('Edição iniciada via beginEdit');
                                }
                            } else {
                                console.log('Nenhuma linha válida selecionada para edição');
                            }
                        } catch (editError) {
                            console.error('Erro ao iniciar edição com Enter:', editError);
                        }
                    }
                });

                console.log('Event listener para Enter configurado no Gantt');
            }
        } catch (error) {
            console.error('Erro ao configurar event listener Enter:', error);
        }
    }, 500);
}

// Adicionar o Gantt ao DOM
if (ganttChart) {
    try {
        ganttChart.appendTo('#Gantt');
        console.log('Gantt inicializado com sucesso');

        // Configurar event listener para Enter
        setupEnterKeyEditing();
    } catch (error) {
        console.error('Erro ao anexar Gantt ao DOM:', error);
    }
}

// Configurar função dataBound
if (ganttChart) {
    ganttChart.dataBound = function() {
        try {
            if (!ganttChart.isInitialLoad) {
                ganttChart.isInitialLoad = true;

                // Inicializar textos dos botões com idioma padrão
                var currentLanguage = document.getElementById('languageSelector').value || 'pt-BR';
                if (typeof updateButtonTexts !== 'undefined') {
                    updateButtonTexts(currentLanguage);
                }

                setTimeout(function() {
                    if (ganttChart && ganttChart.fitToProject) {
                        ganttChart.fitToProject();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Erro na função dataBound:', error);
        }
    };
}
