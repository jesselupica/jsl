/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Button} from 'isl-components/Button';
import {Icon} from 'isl-components/Icon';
import {TextField} from 'isl-components/TextField';
import {Tooltip} from 'isl-components/Tooltip';
import {useAtomValue} from 'jotai';
import {useState} from 'react';
import * as stylex from '@stylexjs/stylex';
import {Row} from './ComponentUtils';
import {T, t} from './i18n';
import {BookmarkCreateOperation} from './operations/BookmarkCreateOperation';
import {useRunOperation} from './operationsState';
import {latestDag} from './serverAPIState';
import {showModal} from './useModal';

const styles = stylex.create({
  modalButtonBar: {
    justifyContent: 'flex-end',
  },
  validationError: {
    color: 'var(--red)',
    fontSize: '12px',
    marginTop: '4px',
  },
});

export function CreateBranchButton() {
  return (
    <Tooltip
      trigger="click"
      component={dismiss => <CreateBranchTooltip dismiss={dismiss} />}
      placement="bottom"
      group="topbar"
      title={<T>Create a new branch at the current commit</T>}>
      <Button icon data-testid="create-branch-tooltip-button">
        <Icon icon="git-branch" />
      </Button>
    </Tooltip>
  );
}

function CreateBranchTooltip({dismiss}: {dismiss: () => unknown}) {
  const runOperation = useRunOperation();
  const dag = useAtomValue(latestDag);
  const [branchName, setBranchName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get the current commit (HEAD)
  const currentCommit = dag.resolve('.');

  const validateBranchName = (name: string): string | null => {
    if (name.trim().length === 0) {
      return null; // Empty is okay, just disable the button
    }
    
    // Git branch name validation rules
    // Cannot start with - or .
    if (name.startsWith('-') || name.startsWith('.')) {
      return t('Branch name cannot start with "-" or "."');
    }
    
    // Cannot contain certain special characters
    if (/[~^:\s\\*?\[]/.test(name)) {
      return t('Branch name cannot contain spaces or special characters: ~ ^ : \\ * ? [');
    }
    
    // Cannot end with .lock
    if (name.endsWith('.lock')) {
      return t('Branch name cannot end with ".lock"');
    }
    
    // Cannot be @
    if (name === '@') {
      return t('Branch name cannot be "@"');
    }
    
    return null;
  };

  const handleBranchNameChange = (value: string) => {
    setBranchName(value);
    const validationError = validateBranchName(value);
    setError(validationError);
  };

  const doCreateBranch = () => {
    if (!currentCommit) {
      setError(t('No current commit found'));
      return;
    }

    const validationError = validateBranchName(branchName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (branchName.trim().length === 0) {
      return;
    }

    // BookmarkCreateOperation will create a branch at the current commit
    runOperation(new BookmarkCreateOperation('.', branchName));
    dismiss();
  };

  return (
    <div style={{padding: '12px', minWidth: '300px'}}>
      <div style={{marginBottom: '12px', fontWeight: 'bold'}}>
        <T>Create New Branch</T>
      </div>
      <div style={{marginBottom: '8px'}}>
        <TextField
          autoFocus
          width="100%"
          placeholder={t('feature/my-branch')}
          value={branchName}
          data-testid="create-branch-input"
          onInput={e => handleBranchNameChange((e.target as unknown as {value: string})?.value ?? '')}
          onKeyDown={e => {
            if (e.key === 'Enter' && branchName.trim().length > 0 && !error) {
              doCreateBranch();
            } else if (e.key === 'Escape') {
              dismiss();
            }
          }}
        />
        {error && <div {...stylex.props(styles.validationError)}>{error}</div>}
      </div>
      <Row {...stylex.props(styles.modalButtonBar)}>
        <Button onClick={() => dismiss()}>
          <T>Cancel</T>
        </Button>
        <Button
          primary
          data-testid="create-branch-button"
          disabled={branchName.trim().length === 0 || error != null}
          onClick={doCreateBranch}>
          <T>Create Branch</T>
        </Button>
      </Row>
    </div>
  );
}

