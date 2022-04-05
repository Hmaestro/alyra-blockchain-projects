# Test du contrat Voting

## Test de l'enregitrement des electeurs
- Seul l'administrateur peut enregistrer les electeurs
- On ne peut pas enregistrer un electeur plus d'une fois
- La session d'enregistrement des électeurs doit être active
- Un électeur enregistré doit avoir la propriété `isRegistered` à `true`
- On doit obtenir l'event `VoterRegistered`

## Test du démarrage de la session d'enregitrement des propositions
- Seul l'administrateur peut démarrer la session d'enregitrement des propositions
- Le `WorkflowStatus` doit être `RegisteringVoters` avant et doit passer à `ProposalsRegistrationStarted` après
- On doit obtenir l'event `WorkflowStatusChange` pour passer du statut `RegisteringVoters` à `ProposalsRegistrationStarted`

## Test de l'enregistrement des propositions
- La session d'enregistrement doit être active
- Seul les électeurs inscrits peuvent faire des propositions
- On ne peut pas proposer une propostion vide
- On doit obtenir l'event `ProposalRegistered`
- Une proposition enregistrée doit avoir la bonne description

## Test de l'arrêt de l'enregistrement des propositions
- Seul l'administrateur peut arrêter l'enregistrement des propositions
- Le `WorkflowStatus` doit être à `ProposalsRegistrationStarted` avant et `ProposalsRegistrationEnded` après
- On doit obtenir l'event `WorkflowStatusChange` pour passer du statut `ProposalsRegistrationStarted` à `ProposalsRegistrationEnded`

## Test du démarrage de la session de vote
- Seul l'administrateur peut arrêter l'enregistrement des propositions
- Le `WorkflowStatus` doit être à `ProposalsRegistrationEnded` avant et `VotingSessionStarted` après
- On doit obtenir l'event `WorkflowStatusChange` pour passer du statut `ProposalsRegistrationEnded` à `VotingSessionStarted`

## Test de la session de vote
- La session de vote doit être active
- Seul les électeurs inscrits peuvent voter
- On peut seulement voter sur les propositions enregistrées
- Un electeur ne peut voter qu'une seule fois
- On doit obtenir l'event `Voted`
- Le vote de chaque électeur doit être enregistré
- Les electeurs qui ont voté doivent être marqués `hasVoted`
- Le nombre de vote obtenu par la proposition votée doit être incrémenté

## Test de l'arrêt des votes
- Seul l'administrateur peut arrêter la session de vote
- Le `WorkflowStatus` doit être à `VotingSessionStarted` avant et `VotingSessionEnded` après 
- On doit obtenir l'event `WorkflowStatusChange` pour passer du statut `VotingSessionStarted` à `VotingSessionEnded`

# Test du comptage des votes
- Seul l'administrateur peut comptabiliser les votes
- La session de vote doit être terminée
- Le WorkflowStatusChange doit être `VotingSessionEnded` avant et `VotesTallied` après
- On doit obtenir l'event `WorkflowStatusChange` pour passer du statut `VotingSessionEnded` à `VotesTallied`
- La proposition qui obtient le plus de voix doit gagner
