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
        throw new Error('Depend��ncias não carregadas. Verifique se todos os scripts foram carregados.');
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
    selectionSettings: {
        mode: 'Row',
        type: 'Single'
    },
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

    // EVENTO DE SELEÇÃO DE LINHA
    rowSelected: function (args) {
        // Armazenar índice da linha selecionada
        if (args.rowIndex !== undefined) {
            currentSelectedRowIndex = args.rowIndex;
            console.log('Linha selecionada:', args.rowIndex, 'TaskID:', args.data ? args.data.TaskID : 'N/A', 'TaskName:', args.data ? args.data.TaskName : 'N/A');
        }
    },

    rowDeselected: function (args) {
        // Resetar seleção se linha foi desselecionada
        if (args.rowIndex === currentSelectedRowIndex) {
            currentSelectedRowIndex = -1;
            console.log('Linha desselecionada:', args.rowIndex);
        }
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

// Função de debug para diagnóstico
function debugRowInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('currentSelectedRowIndex:', currentSelectedRowIndex);

    var activeRows = document.querySelectorAll('.e-treegrid .e-row.e-active, .e-treegrid .e-row[aria-selected="true"]');
    console.log('Linhas ativas no DOM:', activeRows.length);

    activeRows.forEach(function(row, index) {
        var ariaRowIndex = row.getAttribute('aria-rowindex');
        console.log('Linha ativa', index, '- aria-rowindex:', ariaRowIndex);
    });

    if (ganttChart && ganttChart.getSelectedRowIndexes) {
        var selectedIndexes = ganttChart.getSelectedRowIndexes();
        console.log('Índices selecionados (API Gantt):', selectedIndexes);
    }

    if (ganttChart && ganttChart.dataSource) {
        console.log('Total de linhas no dataSource:', ganttChart.dataSource.length);
        ganttChart.dataSource.forEach(function(item, index) {
            console.log('Linha', index, '- TaskID:', item.TaskID, 'TaskName:', item.TaskName);
        });
    }
    console.log('===================');
}

// Função utilitária para focar no campo TaskName após iniciar edição
function focusTaskNameField() {
    setTimeout(function() {
        try {
            var taskNameInput = document.querySelector(
                '.e-treegrid .e-editedbatchcell input, ' +
                '.e-treegrid .e-inline-edit input[aria-label*="Task"], ' +
                '.e-treegrid .e-inline-edit input[name="TaskName"], ' +
                '.e-treegrid .e-editedrow input, ' +
                '.e-treegrid td[aria-describedby*="TaskName"] input, ' +
                'input[aria-label*="Task Name"]'
            );
            if (taskNameInput) {
                taskNameInput.focus();
                taskNameInput.select();
                console.log('Campo TaskName focado após Enter');
            }
        } catch (error) {
            console.log('Não foi possível focar TaskName:', error);
        }
    }, 100);
}

// Função para configurar evento Enter para edição
function setupEnterKeyEditing() {
    // Aguardar o componente estar totalmente carregado
    setTimeout(function() {
        try {
            var ganttElement = document.getElementById('Gantt');
            if (ganttElement) {
                // Event listener único e simplificado
                ganttElement.addEventListener('keydown', function(event) {
                    console.log('Tecla pressionada:', event.key, 'Código:', event.keyCode);

                    // Apenas processar Enter
                    if (event.key !== 'Enter' && event.keyCode !== 13) {
                        return;
                    }

                    console.log('🎯 ENTER DETECTADO! Processando...');

                    // Verificar se já estamos em modo de edição
                    var isInEditMode = document.querySelector('.e-treegrid .e-editedrow, .e-treegrid .e-editedbatchcell, .e-treegrid input, .e-treegrid textarea');
                    if (isInEditMode) {
                        console.log('Já em modo de edição, ignorando Enter');
                        return; // Deixar comportamento padrão
                    }

                    try {
                        console.log('🔄 Processando Enter...');
                        console.log('currentSelectedRowIndex:', currentSelectedRowIndex);

                        var targetRowIndex = -1;
                        var taskData = null;

                        // Método 1: Usar linha selecionada rastreada (mais confiável)
                        if (currentSelectedRowIndex >= 0) {
                            targetRowIndex = currentSelectedRowIndex;
                            console.log('✅ Usando linha rastreada:', targetRowIndex);
                        }
                        // Método 2: Usar API do Gantt
                        else if (ganttChart && ganttChart.getSelectedRowIndexes) {
                            var selectedIndexes = ganttChart.getSelectedRowIndexes();
                            if (selectedIndexes && selectedIndexes.length > 0) {
                                targetRowIndex = selectedIndexes[0];
                                console.log('✅ Usando API Gantt:', targetRowIndex);
                            }
                        }

                        // Verificar se temos dados válidos
                        if (targetRowIndex >= 0 && ganttChart && ganttChart.dataSource && targetRowIndex < ganttChart.dataSource.length) {
                            taskData = ganttChart.dataSource[targetRowIndex];
                            var taskId = taskData.TaskID;

                            console.log('🎯 INICIANDO EDIÇÃO:');
                            console.log('- Linha:', targetRowIndex);
                            console.log('- TaskID:', taskId);
                            console.log('- TaskName:', taskData.TaskName);

                            // Prevenir comportamento padrão
                            event.preventDefault();
                            event.stopPropagation();

                            // Iniciar edição - tentar diferentes métodos
                            var editSuccess = false;

                            if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                                try {
                                    ganttChart.treeGrid.editCell(targetRowIndex, 'TaskName');
                                    console.log('✅ Edição via treeGrid.editCell');
                                    editSuccess = true;
                                } catch (editError) {
                                    console.log('❌ Erro treeGrid.editCell:', editError);
                                }
                            }

                            if (!editSuccess && ganttChart.startEdit && taskId) {
                                try {
                                    ganttChart.startEdit(taskId);
                                    console.log('✅ Edição via startEdit');
                                    editSuccess = true;
                                } catch (editError) {
                                    console.log('❌ Erro startEdit:', editError);
                                }
                            }

                            if (!editSuccess && ganttChart.beginEdit && taskData) {
                                try {
                                    ganttChart.beginEdit(taskData);
                                    console.log('✅ Edição via beginEdit');
                                    editSuccess = true;
                                } catch (editError) {
                                    console.log('❌ Erro beginEdit:', editError);
                                }
                            }

                            if (editSuccess) {
                                // Focar campo TaskName
                                focusTaskNameField();
                            } else {
                                console.log('❌ Nenhum método de edição funcionou');
                            }
                        } else {
                            console.log('❌ Linha inválida ou sem dados:');
                            console.log('- targetRowIndex:', targetRowIndex);
                            console.log('- dataSource length:', ganttChart ? ganttChart.dataSource.length : 'N/A');
                        }
                    } catch (editError) {
                        console.error('Erro ao processar Enter:', editError);
                    }
                });

                // Event listener para clicks em linhas (para rastreamento)
                ganttElement.addEventListener('click', function(event) {
                    try {
                        var clickedRow = event.target.closest('.e-treegrid .e-row');
                        if (clickedRow) {
                            var ariaRowIndex = clickedRow.getAttribute('aria-rowindex');
                            if (ariaRowIndex !== null) {
                                var rowIndex = parseInt(ariaRowIndex);
                                currentSelectedRowIndex = rowIndex;
                                console.log('Clique na linha:', rowIndex);
                            }
                        }
                    } catch (clickError) {
                        console.log('Erro ao processar clique:', clickError);
                    }
                });

                console.log('Event listeners configurados (Enter + Click)');
            }

            // Event listener super simples no document (captura Enter globalmente)
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    console.log('🌍 GLOBAL Enter detectado!');

                    // Verificar se não estamos editando
                    var isEditing = document.querySelector('.e-treegrid .e-editedrow, .e-treegrid .e-editedbatchcell, .e-treegrid input, .e-treegrid textarea');
                    if (!isEditing && currentSelectedRowIndex >= 0) {
                        console.log('🎯 GLOBAL: Linha selecionada disponível:', currentSelectedRowIndex);

                        if (ganttChart && ganttChart.dataSource && currentSelectedRowIndex < ganttChart.dataSource.length) {
                            var taskData = ganttChart.dataSource[currentSelectedRowIndex];

                            console.log('🚀 GLOBAL: Iniciando edição da linha:', currentSelectedRowIndex, 'TaskName:', taskData.TaskName);

                            event.preventDefault();
                            event.stopPropagation();

                            // Edição direta
                            try {
                                ganttChart.treeGrid.editCell(currentSelectedRowIndex, 'TaskName');
                                console.log('✅ GLOBAL: Edição iniciada com sucesso!');
                                focusTaskNameField();
                            } catch (error) {
                                console.log('❌ GLOBAL: Erro na edição:', error);
                            }
                        }
                    } else if (isEditing) {
                        console.log('⏸️ GLOBAL: Já em modo de edição, ignorando');
                    } else {
                        console.log('⏸️ GLOBAL: Nenhuma linha selecionada');
                    }
                }
            }, true);

        } catch (error) {
            console.error('Erro ao configurar event listeners:', error);
        }
    }, 500);
}

// Função global para debug manual (pode ser chamada no console)
window.debugGanttSelection = function() {
    console.log('🔍 DIAGNÓSTICO MANUAL GANTT SELECTION');
    debugRowInfo();

    // Informações adicionais
    var focusedElement = document.activeElement;
    console.log('Elemento com foco:', focusedElement.tagName, focusedElement.className);

    var clickedRows = document.querySelectorAll('.e-treegrid .e-row:hover, .e-treegrid .e-row.e-active');
    console.log('Linhas com hover/active:', clickedRows.length);

    if (ganttChart) {
        console.log('Gantt Chart carregado:', !!ganttChart);
        console.log('DataSource disponível:', !!ganttChart.dataSource);
        console.log('TreeGrid disponível:', !!ganttChart.treeGrid);
    }
};

// Função para teste manual de edição (pode ser chamada no console)
window.testEditCurrentRow = function() {
    console.log('🧪 TESTE MANUAL DE EDIÇÃO');
    console.log('Linha selecionada:', currentSelectedRowIndex);

    if (currentSelectedRowIndex >= 0 && ganttChart && ganttChart.dataSource && currentSelectedRowIndex < ganttChart.dataSource.length) {
        var taskData = ganttChart.dataSource[currentSelectedRowIndex];
        console.log('Dados da linha:', taskData);

        try {
            if (ganttChart.treeGrid && ganttChart.treeGrid.editCell) {
                ganttChart.treeGrid.editCell(currentSelectedRowIndex, 'TaskName');
                console.log('✅ Edição manual iniciada!');
                focusTaskNameField();
            } else {
                console.log('❌ treeGrid.editCell não disponível');
            }
        } catch (error) {
            console.log('❌ Erro na edição manual:', error);
        }
    } else {
        console.log('❌ Linha inválida ou sem dados');
    }
};

// Adicionar o Gantt ao DOM
if (ganttChart) {
    try {
        ganttChart.appendTo('#Gantt');
        console.log('Gantt inicializado com sucesso');

        // Configurar foco no elemento Gantt
        var ganttElement = document.getElementById('Gantt');
        if (ganttElement) {
            ganttElement.setAttribute('tabindex', '0');
            ganttElement.style.outline = 'none';
            console.log('Foco configurado no elemento Gantt');
        }

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
